import { storeEvalFactory } from '../../storeEval/storeEvalFactory';
import { MockDurableStore } from '@luvio/adapter-test-library';
import { SQLEvaluatingStore } from '../../SQLEvaluatingStore';
import {
    buildTTLStrategy,
    evaluationResults,
    flushPromises,
    snapshotTemplate,
    TABLE_ATTRS_DB_RESULT,
    TABLE_ATTRS_JSON,
} from './util';
import { objectInfoSql } from '../../ast-to-sql';
import { parseAndVisit as parse } from '@luvio/graphql-parser';
import infoJson from '../mockData/objectInfos.json';
import { SnapshotState } from '../../storeEval/snapshot';

type SetupOptions = { evalResult?: string | string[]; isEvalSupported?: boolean };

function setup({ evalResult = '{}', isEvalSupported = true }: SetupOptions = {}) {
    const results = Array.isArray(evalResult) ? evalResult : [evalResult];

    const sqlStore: SQLEvaluatingStore = {
        isEvalSupported: function (): boolean {
            return isEvalSupported;
        },

        updateIndices: jest.fn(() => Promise.resolve()),

        evaluateSQL: (_input) => {
            return Promise.resolve(results.shift());
        },
    };

    return { sqlStore };
}

const source = /* GraphQL */ `
    query {
        uiapi {
            query {
                TimeSheet @connection {
                    edges {
                        node @resource(type: "Record") {
                            TimeSheetNumber {
                                value
                                displayValue
                            }
                        }
                    }
                }
            }
        }
    }
`;

const ttlStrategy = buildTTLStrategy(900);

describe('storeEvalFactory', () => {
    describe('on create', () => {
        it('subscribes to durable store changes', async () => {
            const { sqlStore } = setup({
                evalResult: [TABLE_ATTRS_DB_RESULT, JSON.stringify(infoJson)],
            });

            let durableStore: MockDurableStore = new MockDurableStore();

            expect(durableStore.listeners.size).toEqual(0);
            const _ = storeEvalFactory('userId', durableStore, sqlStore);
            await flushPromises();

            expect(durableStore.listeners.size).toEqual(1);
        });

        it('queries object info', async () => {
            const { sqlStore } = setup({
                evalResult: [TABLE_ATTRS_DB_RESULT, JSON.stringify(infoJson)],
            });

            let durableStore: MockDurableStore = new MockDurableStore();
            const spy = jest.spyOn(sqlStore, 'evaluateSQL');

            const _ = storeEvalFactory('userId', durableStore, sqlStore);
            await flushPromises();

            expect(spy).toHaveBeenNthCalledWith(2, objectInfoSql(TABLE_ATTRS_JSON), []);
        });
    });

    describe('storeEval', () => {
        it('fails promise if eval is not supported by graphql store', async () => {
            expect.assertions(1);
            const { sqlStore } = setup({
                evalResult: [TABLE_ATTRS_DB_RESULT, JSON.stringify(infoJson)],
                isEvalSupported: false,
            });

            const durableStore: MockDurableStore = new MockDurableStore();
            const ast = parse(source);
            const storeEval = storeEvalFactory('userId', durableStore, sqlStore);

            await flushPromises();

            return storeEval(ast, ttlStrategy).catch((e) => {
                expect(e).toEqual('Eval is not supported.');
            });
        });

        it('fails promise if graphql ast can not be converted to sql due no object info', async () => {
            expect.assertions(1);
            const { sqlStore } = setup({
                evalResult: [TABLE_ATTRS_DB_RESULT, '{}'],
                isEvalSupported: true,
            });

            const durableStore: MockDurableStore = new MockDurableStore();
            const ast = parse(source);
            const storeEval = storeEvalFactory('userId', durableStore, sqlStore);

            await flushPromises();
            return storeEval(ast, ttlStrategy).catch((e) => {
                expect(e).toEqual(
                    'Could not map GraphQL AST to SQL: [{"type":"MissingObjectInfoError","object":"TimeSheet"}]'
                );
            });
        });

        it('fails promise when snapshot creation fails', async () => {
            expect.assertions(1);
            const { sqlStore } = setup({
                evalResult: [TABLE_ATTRS_DB_RESULT, JSON.stringify(infoJson), 'BAD JSON'],
                isEvalSupported: true,
            });

            const durableStore: MockDurableStore = new MockDurableStore();
            const ast = parse(source);
            const storeEval = storeEvalFactory('userId', durableStore, sqlStore);

            await flushPromises();
            return storeEval(ast, ttlStrategy).catch((e) => {
                expect(`${e}`).toContain('SyntaxError');
            });
        });

        it('returns unfulfilled snapshot', async () => {
            expect.assertions(1);
            const now = Date.now();
            const unfulfilledExpiration = now - 2000;

            const { sqlStore } = setup({
                evalResult: [
                    TABLE_ATTRS_DB_RESULT,
                    JSON.stringify(infoJson),
                    evaluationResults(unfulfilledExpiration),
                ],
                isEvalSupported: true,
            });

            const durableStore: MockDurableStore = new MockDurableStore();
            const ast = parse(source);
            const storeEval = storeEvalFactory('userId', durableStore, sqlStore);

            await flushPromises();
            return storeEval(ast, ttlStrategy).then((snapshot) => {
                expect(snapshot).toEqual(
                    snapshotTemplate(unfulfilledExpiration, SnapshotState.Unfulfilled)
                );
            });
        });

        it('refreshes from network async when snapshot is stale', async () => {
            expect.assertions(1);

            const now = Date.now();
            const staleExpiration = now - 850;

            const { sqlStore } = setup({
                evalResult: [
                    TABLE_ATTRS_DB_RESULT,
                    JSON.stringify(infoJson),
                    evaluationResults(staleExpiration),
                ],
                isEvalSupported: true,
            });

            const durableStore: MockDurableStore = new MockDurableStore();
            const ast = parse(source);
            const storeEval = storeEvalFactory('userId', durableStore, sqlStore);

            await flushPromises();
            return storeEval(ast, ttlStrategy).then((snapshot) => {
                expect(snapshot).toEqual(snapshotTemplate(staleExpiration, SnapshotState.Stale));
            });
        });

        it('returns fulfilled snapshot', async () => {
            expect.assertions(1);

            const now = Date.now();
            const freshExpiration = now + 850;

            const { sqlStore } = setup({
                evalResult: [
                    TABLE_ATTRS_DB_RESULT,
                    JSON.stringify(infoJson),
                    evaluationResults(freshExpiration),
                ],
                isEvalSupported: true,
            });

            const durableStore: MockDurableStore = new MockDurableStore();
            const ast = parse(source);
            const storeEval = storeEvalFactory('userId', durableStore, sqlStore);

            await flushPromises();
            return storeEval(ast, ttlStrategy).then((snapshot) => {
                expect(snapshot).toEqual(
                    snapshotTemplate(freshExpiration, SnapshotState.Fulfilled)
                );
            });
        });
    });
});
