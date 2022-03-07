import { MockDurableStore } from '@luvio/adapter-test-library';
import { parseAndVisit as parse } from '@luvio/graphql-parser';
import type { SqlDurableStore } from '@salesforce/lds-store-sql';

import { storeEvalFactory } from '../../storeEval/storeEvalFactory';
import {
    evaluationResults,
    flushPromises,
    snapshotTemplate,
    TABLE_ATTRS_DB_RESULT,
    TABLE_ATTRS_JSON,
} from './util';
import { objectInfoSql } from '../../ast-to-sql';
import infoJson from '../mockData/objectInfos.json';

type SetupOptions = { evalResult?: string | string[]; isEvalSupported?: boolean };

function setup({ evalResult = '{}', isEvalSupported = true }: SetupOptions = {}) {
    const results = Array.isArray(evalResult) ? evalResult : [evalResult];

    // TODO [W-10530832]: export a MockSqlDurableStore from lds-store-sql for testing usage that uses
    // sqlite3 node package
    const sqlStore: SqlDurableStore = Object.create(new MockDurableStore(), {
        isEvalSupported: { value: () => isEvalSupported },
        updateIndices: { value: jest.fn(() => Promise.resolve()) },
        evaluateSQL: {
            value: jest.fn().mockImplementation((_input) => {
                return Promise.resolve(results.shift());
            }),
        },
    });

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

describe('storeEvalFactory', () => {
    describe('on create', () => {
        it('subscribes to durable store changes', async () => {
            const { sqlStore } = setup({
                evalResult: [TABLE_ATTRS_DB_RESULT, JSON.stringify(infoJson)],
            });

            expect((sqlStore as unknown as MockDurableStore).listeners.size).toEqual(0);
            const _ = storeEvalFactory('userId', sqlStore);
            await flushPromises();

            expect((sqlStore as unknown as MockDurableStore).listeners.size).toEqual(1);
        });

        it('queries object info', async () => {
            const { sqlStore } = setup({
                evalResult: [TABLE_ATTRS_DB_RESULT, JSON.stringify(infoJson)],
            });

            const _ = storeEvalFactory('userId', sqlStore);
            await flushPromises();

            expect(sqlStore.evaluateSQL).toHaveBeenNthCalledWith(
                2,
                objectInfoSql(TABLE_ATTRS_JSON),
                []
            );
        });
    });

    describe('storeEval', () => {
        const nonEvaluatedSnapshot = { data: { id: 'foo' }, state: 'Fulfilled' } as any;

        it('returns non-evaluated snapshot when eval is not supported by graphql store', async () => {
            expect.assertions(2);
            const { sqlStore } = setup({
                evalResult: [TABLE_ATTRS_DB_RESULT, JSON.stringify(infoJson)],
                isEvalSupported: false,
            });

            const ast = parse(source);
            const storeEval = storeEvalFactory('userId', sqlStore);

            await flushPromises();

            await storeEval(ast, nonEvaluatedSnapshot, false).then((snapshot) => {
                expect(snapshot).toEqual(nonEvaluatedSnapshot);
            });

            await storeEval(ast, Promise.resolve(nonEvaluatedSnapshot), false).then((snapshot) => {
                expect(snapshot).toEqual(nonEvaluatedSnapshot);
            });
        });

        it('return non eval snapshot if graphql ast can not be converted to sql due no object info', async () => {
            const { sqlStore } = setup({
                evalResult: [TABLE_ATTRS_DB_RESULT, '{}'],
                isEvalSupported: true,
            });

            const ast = parse(source);
            const storeEval = storeEvalFactory('userId', sqlStore);

            await flushPromises();
            const snapshot1 = await storeEval(ast, nonEvaluatedSnapshot, false);
            expect(snapshot1).toEqual(nonEvaluatedSnapshot);

            const snapshot2 = await storeEval(ast, Promise.resolve(nonEvaluatedSnapshot), false);
            expect(snapshot2).toEqual(nonEvaluatedSnapshot);
        });

        it('returns non-evaluated snapshot when snapshot creation fails', async () => {
            expect.assertions(2);
            const { sqlStore } = setup({
                evalResult: [TABLE_ATTRS_DB_RESULT, JSON.stringify(infoJson), 'BAD JSON'],
                isEvalSupported: true,
            });

            const ast = parse(source);
            const storeEval = storeEvalFactory('userId', sqlStore);

            await flushPromises();
            const snapshot1 = await storeEval(ast, nonEvaluatedSnapshot, false);
            expect(snapshot1).toEqual(nonEvaluatedSnapshot);

            const snapshot2 = await storeEval(ast, Promise.resolve(nonEvaluatedSnapshot), false);
            expect(snapshot2).toEqual(nonEvaluatedSnapshot);
        });

        describe('non-evaluated snapshot is unfulfilled', () => {
            describe('alwaysReturnEvalSnapshot is true', () => {
                it('returns evaluated fulfilled snapshot regardless of record metadata', async () => {
                    const unfulfilledSnapshot = { ...nonEvaluatedSnapshot, state: 'Unfulfilled' };

                    const now = Date.now();
                    const unfulfilledExpiration = now - 2000;
                    const expectedSnapshot = snapshotTemplate(unfulfilledExpiration, 'Fulfilled');
                    const { sqlStore } = setup({
                        evalResult: [
                            TABLE_ATTRS_DB_RESULT,
                            JSON.stringify(infoJson),
                            evaluationResults(unfulfilledExpiration),
                            evaluationResults(unfulfilledExpiration),
                        ],
                        isEvalSupported: true,
                    });

                    const ast = parse(source);
                    const storeEval = storeEvalFactory('userId', sqlStore);
                    await flushPromises();

                    const snapshot1 = await storeEval(ast, unfulfilledSnapshot, true);
                    expect(snapshot1).toEqual(expectedSnapshot);

                    const snapshot2 = await storeEval(
                        ast,
                        Promise.resolve(unfulfilledSnapshot),
                        true
                    );
                    expect(snapshot2).toEqual(expectedSnapshot);
                });
            });

            describe('alwaysReturnEvalSnapshot is false', () => {
                it('returns non-eval snapshot', async () => {
                    const unfulfilledSnapshot = {
                        ...nonEvaluatedSnapshot,
                        state: 'Unfulfilled',
                    };
                    expect.assertions(2);
                    const now = Date.now();
                    const unfulfilledExpiration = now - 2000;
                    const { sqlStore } = setup({
                        evalResult: [
                            TABLE_ATTRS_DB_RESULT,
                            JSON.stringify(infoJson),
                            evaluationResults(unfulfilledExpiration),
                            evaluationResults(unfulfilledExpiration),
                        ],
                        isEvalSupported: true,
                    });

                    const ast = parse(source);
                    const storeEval = storeEvalFactory('userId', sqlStore);
                    await flushPromises();

                    const snapshot1 = await storeEval(ast, unfulfilledSnapshot, false);
                    expect(snapshot1).toEqual(unfulfilledSnapshot);

                    const snapshot2 = await storeEval(
                        ast,
                        Promise.resolve(unfulfilledSnapshot),
                        false
                    );
                    expect(snapshot2).toEqual(unfulfilledSnapshot);
                });
            });
        });

        describe('non-evaluated snapshot is Stale', () => {
            it('returns Stale snapshot with evaluated data and seen records', async () => {
                expect.assertions(2);
                const staleSnapshot = { ...nonEvaluatedSnapshot, state: 'Stale' };

                const now = Date.now();
                const staleExpiration = now - 850;
                const expectedSnapshot = snapshotTemplate(staleExpiration, 'Fulfilled');

                const { sqlStore } = setup({
                    evalResult: [
                        TABLE_ATTRS_DB_RESULT,
                        JSON.stringify(infoJson),
                        evaluationResults(staleExpiration),
                        evaluationResults(staleExpiration),
                    ],
                    isEvalSupported: true,
                });

                const ast = parse(source);
                const storeEval = storeEvalFactory('userId', sqlStore);

                await flushPromises();

                const snapshot1 = await storeEval(ast, staleSnapshot, false);
                expect(snapshot1).toEqual({
                    ...staleSnapshot,
                    state: 'Stale',
                    data: expectedSnapshot.data,
                    seenRecords: expectedSnapshot.seenRecords,
                });

                const snapshot2 = await storeEval(ast, Promise.resolve(staleSnapshot), false);
                expect(snapshot2).toEqual({
                    ...staleSnapshot,
                    state: 'Stale',
                    data: expectedSnapshot.data,
                    seenRecords: expectedSnapshot.seenRecords,
                });
            });
        });

        describe('non-evaluated snapshot is Fulfilled', () => {
            it('returns Fulfilled snapshot with evaluated data and seen records', async () => {
                expect.assertions(2);
                const fulfilledSnapshot = { ...nonEvaluatedSnapshot, state: 'Fulfilled' };

                const now = Date.now();
                const freshExpiration = now + 850;
                const expectedSnapshot = snapshotTemplate(freshExpiration, 'Fulfilled');

                const { sqlStore } = setup({
                    evalResult: [
                        TABLE_ATTRS_DB_RESULT,
                        JSON.stringify(infoJson),
                        evaluationResults(freshExpiration),
                        evaluationResults(freshExpiration),
                    ],
                    isEvalSupported: true,
                });

                const ast = parse(source);
                const storeEval = storeEvalFactory('userId', sqlStore);

                await flushPromises();

                const snapshot1 = await storeEval(ast, fulfilledSnapshot, false);
                expect(snapshot1).toEqual({
                    ...fulfilledSnapshot,
                    state: 'Fulfilled',
                    data: expectedSnapshot.data,
                    seenRecords: expectedSnapshot.seenRecords,
                });

                const snapshot2 = await storeEval(ast, Promise.resolve(fulfilledSnapshot), false);
                expect(snapshot2).toEqual({
                    ...fulfilledSnapshot,
                    state: 'Fulfilled',
                    data: expectedSnapshot.data,
                    seenRecords: expectedSnapshot.seenRecords,
                });
            });
        });
    });
});
