import { parseAndVisit } from '@luvio/graphql-parser';
import { setup, durableStore } from './integrationTestSetup';
import { configuration } from '@salesforce/lds-adapters-graphql';

import mockAccount from './data/record-Account-fields-Account.Id,Account.Name.json';
import mockUser from './data/record-User-fields-User.Id,User.City.json';

import mockData_Account_fields_Name from './data/gql/RecordQuery-Account2-fields-Name.json';
import mockData_User_fields_City from './data/gql/RecordQuery-User-fields-City.json';

import { DefaultDurableSegment } from '@luvio/environments';

import { keyBuilderRecord } from '@salesforce/lds-adapters-uiapi';
import { StoreMetadata } from '@luvio/engine';
import { tableAttrsSql } from '@salesforce/lds-graphql-eval';
import { JSONStringify } from '../../../utils/language';

const recordId = mockAccount.id;

function makeMetadata(expirations: number[]): StoreMetadata[] {
    return expirations.map((timeStamp) => {
        return {
            ingestionTimestamp: 1634703585585,
            expirationTimestamp: timeStamp,
            representationName: 'RecordRepresentation',
            namespace: 'UiApi',
        };
    });
}

const accountQuery = (predicate: string) =>
    parseAndVisit(/* GraphQL */ `
    query {
        uiapi {
            query {
                Account(where: ${predicate}) @connection {
                    edges {
                        node @resource(type: "Record") {
                            Name {
                                value
                                displayValue
                            }
                        }
                    }
                }
            }
        }
    }
`);

const userQuery = parseAndVisit(/* GraphQL */ `
    query {
        uiapi {
            query {
                User(where: { City: { like: "Montreal" } }) @connection {
                    edges {
                        node @resource(type: "Record") {
                            Id
                            City {
                                value
                                displayValue
                            }
                        }
                    }
                }
            }
        }
    }
`);

const tableAttrs = {
    LdsSoupValue: 'value',
    LdsSoupKey: 'key',
    LdsSoupTable: 'DEFAULT',
};

const original_evaluateSql = durableStore.evaluateSQL;

describe('mobile runtime integration tests', () => {
    async function initEnv() {
        durableStore.evaluateSQL = original_evaluateSql;
        const evaluateSqlSpy = jest
            .spyOn(durableStore, 'evaluateSQL')
            .mockImplementation(
                (
                    sql: string,
                    params: string[],
                    onResult: (message: string) => void,
                    onError: (message: string) => void
                ) => {
                    if (sql === tableAttrsSql) {
                        return new Promise<void>((resolve) => {
                            onResult(JSON.stringify(tableAttrs));
                            resolve();
                        });
                    }

                    return original_evaluateSql.apply(durableStore, [
                        sql,
                        params,
                        onResult,
                        onError,
                    ]);
                }
            );

        const { storeEval, ...setupResult } = await setup();
        configuration.setStoreEval(storeEval);

        return { ...setupResult, evaluateSqlSpy };
    }

    describe('GraphQL storeEval', () => {
        it('returns locally evaluated snapshot', async () => {
            const { evaluateSqlSpy, networkAdapter, graphQL } = await initEnv();

            const initialEvalCount = evaluateSqlSpy.mock.calls.length;
            expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount);

            const now = Date.now();
            const expirationTimestamp = now + 100;
            const metadata = makeMetadata([expirationTimestamp])[0];

            await durableStore.set(keyBuilderRecord({ recordId }), DefaultDurableSegment, {
                data: { ...mockAccount },
                metadata,
            });
            await durableStore.set(
                keyBuilderRecord({ recordId: mockUser.id }),
                DefaultDurableSegment,
                { data: { ...mockUser }, metadata }
            );

            await durableStore.flushPendingWork();

            const query = accountQuery('{ Name: { like: "Burlington%" } }');
            const config = { query, variables: {} };
            const snapshot = await graphQL(config);

            //Confirm L2 eval
            expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);

            const callCount = networkAdapter.sentRequests.length;
            expect(callCount).toBe(0);

            expect(snapshot.state).toEqual('Fulfilled');

            expect(snapshot.data).toEqual({
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Id: '001xx000003Gn4WAAS',
                                            Name: {
                                                value: 'Burlington Textiles Corp of America',
                                                displayValue: null,
                                            },
                                            _drafts: null,
                                            _metadata: {
                                                expirationTimestamp,
                                                ingestionTimestamp: 1634703585585,
                                                namespace: 'UiApi',
                                                representationName: 'RecordRepresentation',
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            });
        });

        it('evaluates against draft data', async () => {
            const { evaluateSqlSpy, networkAdapter, graphQL, updateRecord } = await initEnv();

            const initialEvalCount = evaluateSqlSpy.mock.calls.length;
            expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount);

            const now = Date.now();
            const expirationTimestamp = now + 100;
            const metadata = makeMetadata([expirationTimestamp])[0];

            await durableStore.set(keyBuilderRecord({ recordId }), DefaultDurableSegment, {
                data: { ...mockAccount, links: {} },
                metadata,
            });

            await durableStore.flushPendingWork();

            await updateRecord({
                recordId,
                fields: { Name: "Adrian's Taco Trucks" },
            });

            const query = accountQuery('{ Name: { like: "Adrian%" } }');
            const config = { query, variables: {} };
            const snapshot = await graphQL(config);

            //Confirm L2 eval
            expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);

            const callCount = networkAdapter.sentRequests.length;
            expect(callCount).toBe(0);

            //metadata is lost after drafts are written.
            //publishChangesToDurableStore writes again but loses metadata because
            //ingestStore.metadata does not include metadata for the record
            expect(snapshot.state).toEqual('Fulfilled');
            expect(snapshot.data).toEqual({
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Id: '001xx000003Gn4WAAS',
                                            Name: {
                                                value: "Adrian's Taco Trucks",
                                                displayValue: "Adrian's Taco Trucks",
                                            },
                                            _drafts: {
                                                created: false,
                                                deleted: false,
                                                edited: true,
                                                draftActionIds: [expect.any(String)],
                                                latestDraftActionId: expect.any(String),
                                                serverValues: {
                                                    Name: {
                                                        displayValue: null,
                                                        value: 'Burlington Textiles Corp of America',
                                                    },
                                                },
                                            },
                                            _metadata: null,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            });
        });

        it('returns stale eval snapshot and refreshes from network', async () => {
            const { evaluateSqlSpy, networkAdapter, graphQL } = await initEnv();

            const initialEvalCount = evaluateSqlSpy.mock.calls.length;
            expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount);

            const now = Date.now();
            const expirationTimestamp = now - 10000;
            const metadata = makeMetadata([expirationTimestamp])[0];

            await durableStore.set(keyBuilderRecord({ recordId }), DefaultDurableSegment, {
                data: { ...mockAccount, links: {} },
                metadata,
            });
            await durableStore.set(
                keyBuilderRecord({ recordId: mockUser.id }),
                DefaultDurableSegment,
                { data: { ...mockUser }, metadata }
            );

            await durableStore.flushPendingWork();

            // Set the mock response
            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(mockData_Account_fields_Name),
            });

            const query = accountQuery('{ Name: { like: "Burlington%" } }');
            const config = { query, variables: {} };
            const snapshot = await graphQL(config);

            //Confirm L2 eval
            expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);

            const callCount = networkAdapter.sentRequests.length;
            expect(callCount).toBe(1);

            expect(snapshot.state).toEqual('Stale');

            const expectedSnapshot = {
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Id: '001xx000003Gn4WAAS',
                                            Name: {
                                                value: 'Burlington Textiles Corp of America',
                                                displayValue: null,
                                            },
                                            _drafts: null,
                                            _metadata: {
                                                expirationTimestamp: expect.any(Number),
                                                ingestionTimestamp: expect.any(Number),
                                                namespace: 'UiApi',
                                                representationName: 'RecordRepresentation',
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            };

            expect(snapshot.data).toEqual(expectedSnapshot);

            //wait for async request to write to L2
            await durableStore.waitForSet((key) => key.indexOf(recordId) > 0);
            await durableStore.flushPendingWork();

            const snapshot2 = await graphQL(config);
            expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 2);
            const callCount2 = networkAdapter.sentRequests.length;
            expect(callCount2).toBe(1);

            expect(snapshot2.state).toEqual('Fulfilled');
            expect(snapshot2.data).toEqual(expectedSnapshot);
        });

        it('should return cached snapshot if object info is not available', async () => {
            const { evaluateSqlSpy, networkAdapter, graphQL } = await initEnv();

            const initialEvalCount = evaluateSqlSpy.mock.calls.length;
            expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount);

            const now = Date.now();
            const expirationTimestamp = now + 100;
            const metadata = makeMetadata([expirationTimestamp])[0];

            await durableStore.set(keyBuilderRecord({ recordId }), DefaultDurableSegment, {
                data: { ...mockAccount },
                metadata,
            });
            await durableStore.set(
                keyBuilderRecord({ recordId: mockUser.id }),
                DefaultDurableSegment,
                { data: { ...mockUser, links: {} }, metadata }
            );

            await durableStore.flushPendingWork();

            // Set the mock response
            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(mockData_User_fields_City),
            });

            const config = { query: userQuery, variables: {} };
            const snapshot = await graphQL(config);

            //Confirm no L2 eval
            expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount);

            const callCount = networkAdapter.sentRequests.length;
            expect(callCount).toBe(1);

            expect(snapshot.state).toEqual('Fulfilled');
            expect(snapshot.data).toEqual({
                data: {
                    uiapi: {
                        query: {
                            User: {
                                edges: [
                                    {
                                        node: {
                                            Id: '005T1000000Huh7IBD',
                                            City: {
                                                value: 'Montreal',
                                                displayValue: null,
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                errors: [],
            });
        });
    });
});
