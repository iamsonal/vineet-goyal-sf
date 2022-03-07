import timekeeper from 'timekeeper';

import { parseAndVisit } from '@luvio/graphql-parser';
import { setup, durableStore } from './integrationTestSetup';
import { configuration } from '@salesforce/lds-adapters-graphql';
import mockAccount from './data/record-Account-fields-Account.Id,Account.Name.json';
import mockData_Account_fields_IsDeleted from './data/record-Account-fields-IsDeleted.json';

import mockUser from './data/record-User-fields-User.Id,User.City.json';
import mockAccountObjectInfo from './data/object-Account.json';

import mockData_Account_fields_Name from './data/gql/RecordQuery-Account2-fields-Name.json';
import mockData_User_fields_City from './data/gql/RecordQuery-User-fields-City.json';

import { keyBuilderRecord, keyBuilderObjectInfo } from '@salesforce/lds-adapters-uiapi';
import { StoreMetadata } from '@luvio/engine';
import { tableAttrsSql } from '@salesforce/lds-graphql-eval';
import { JSONStringify } from '../../../utils/language';
import { DefaultDurableSegment, DurableStoreOperationType } from '@luvio/environments';
import { MockNimbusNetworkAdapter } from '../../MockNimbusNetworkAdapter';
import { RECORD_TTL } from '@salesforce/lds-adapters-uiapi/karma/uiapi-constants';
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
                Account(where: ${predicate}, orderBy: {Id: {order: ASC, nulls: LAST}}) @connection {
                    edges {
                        node @resource(type: "Record") {
                            Id
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

const tableAttrs = {
    LdsSoupValue: 'value',
    LdsSoupKey: 'key',
    LdsSoupTable: 'DEFAULT',
};

const original_evaluateSql = durableStore.evaluateSQL;

async function ingestQuery(
    query: any,
    networkAdapter: MockNimbusNetworkAdapter,
    response: any,
    graphQL: any
) {
    networkAdapter.setMockResponse({
        status: 200,
        headers: {},
        body: JSONStringify(response),
    });

    await durableStore.flushPendingWork();

    const config = { query, variables: {} };
    await graphQL(config);
    await durableStore.flushPendingWork();
}

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
            const query = accountQuery('{ Name: { like: "Burlington%" } }');

            const { evaluateSqlSpy, networkAdapter, graphQL } = await initEnv();
            await ingestQuery(query, networkAdapter, mockData_Account_fields_Name, graphQL);
            const initialNetworkRequestCount = networkAdapter.sentRequests.length;
            const initialEvalCount = evaluateSqlSpy.mock.calls.length;

            const config = { query, variables: {} };
            const snapshot = await graphQL(config);

            //Confirm  L2 eval and no network request
            expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);
            expect(networkAdapter.sentRequests.length).toBe(initialNetworkRequestCount);

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
                                            _drafts: expect.any(Object),
                                            _metadata: expect.any(Object),
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            });
        });

        it('should have properly serialized data in the local snapshot', async () => {
            const { graphQL } = await initEnv();

            const query = parseAndVisit(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        # [W-10693499] Assert proper boolean serialization
                                        IsDeleted {
                                            value
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `);
            const expirationTimestamp = Number.MAX_SAFE_INTEGER;
            const metadata = makeMetadata([expirationTimestamp])[0];

            await durableStore.set(keyBuilderRecord({ recordId }), DefaultDurableSegment, {
                data: { ...mockData_Account_fields_IsDeleted },
                metadata,
            });

            await durableStore.flushPendingWork();
            const config = { query, variables: {} };

            const snapshot = await graphQL(config, {
                cachePolicy: {
                    type: 'only-if-cached',
                },
            });
            expect(snapshot.state).toEqual('Fulfilled');
            expect(snapshot.data).toEqual({
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Id: expect.any(String),
                                            IsDeleted: {
                                                value: false,
                                            },
                                            _drafts: expect.any(Object),
                                            _metadata: expect.any(Object),
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
            const query = accountQuery('{ Name: { like: "Adrian%" } }');
            const config = { query, variables: {} };

            const { evaluateSqlSpy, networkAdapter, graphQL, updateRecord } = await initEnv();
            await ingestQuery(query, networkAdapter, mockData_Account_fields_Name, graphQL);
            const initialNetworkRequestCount = networkAdapter.sentRequests.length;
            const initialEvalCount = evaluateSqlSpy.mock.calls.length;

            const snapshot = await graphQL(config);

            expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);
            //No matches for query yet.
            expect(snapshot.data.data.uiapi.query.Account.edges.length).toEqual(0);

            await updateRecord({
                recordId,
                fields: { Name: "Adrian's Taco Trucks" },
            });

            const snapshotWithTacoTrucks = await graphQL(config);

            //Confirm L2 eval and no network
            expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 2);
            expect(networkAdapter.sentRequests.length).toBe(initialNetworkRequestCount);

            // TODO [W-10696735]: metadata is lost after drafts are written.
            //publishChangesToDurableStore writes again but loses metadata because
            //ingestStore.metadata does not include metadata for the record
            expect(snapshotWithTacoTrucks.state).toEqual('Fulfilled');
            expect(snapshotWithTacoTrucks.data).toEqual({
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
                                            _metadata: expect.any(Object),
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            });
        });

        it('should not eval if object info is not available', async () => {
            const { evaluateSqlSpy, networkAdapter, graphQL: adapter } = await initEnv();

            // Capture initial count of sql calls (our baseline after test setup)
            let sqlEvalCount = evaluateSqlSpy.mock.calls.length;
            // Make sure the user record we side load is not expired
            const [metadata] = makeMetadata([Number.MAX_SAFE_INTEGER]);

            const userKey = keyBuilderRecord({ recordId: mockUser.id });

            // Stage the l2 cache
            await durableStore.batchOperations(
                [
                    // Remove the `User` ObjectInfo representation (which was already present
                    // from global test setup)
                    {
                        ids: [keyBuilderObjectInfo({ apiName: 'User' })],
                        segment: DefaultDurableSegment,
                        type: DurableStoreOperationType.EvictEntries,
                    },
                    {
                        type: DurableStoreOperationType.SetEntries,
                        segment: DefaultDurableSegment,
                        ids: ['UiApi::ObjectInfoRepresentation:Account', userKey],
                        entries: {
                            // GraphQL Eval package caches object info definitions unless new entries are made
                            // Here we force a cache invalidation via a no-op `setEntries` call
                            // ? validate if change detection can also consider cache evictions
                            'UiApi::ObjectInfoRepresentation:Account':
                                JSONStringify(mockAccountObjectInfo),
                            // Side load a user record into the l2 store
                            [userKey]: JSONStringify({
                                data: mockUser,
                                metadata,
                            }),
                        },
                    },
                ],
                ''
            );
            await durableStore.flushPendingWork();

            // The ObjectInfo cache invalidation incurs another hit to the DB, so tick the counter
            sqlEvalCount++;

            // We expect the lack of schema info to bypass graphql eval, so setup a mock network response
            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                // Tweaking the city here so it differs from whats in the database
                body: JSONStringify(mockData_User_fields_City).replace('Montreal', 'Quebec'),
            });

            // Invoke the adapter
            const snapshot = await adapter({
                query: parseAndVisit(/* GraphQL */ `
                    query {
                        uiapi {
                            query {
                                User @connection {
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
                `),
                variables: {},
            });

            // Absent the `User` ObjectInfo, the graphql eval should be
            // skipped and the sql count should still be the same as
            // before the adapter invocation
            expect(evaluateSqlSpy).toHaveBeenCalledTimes(sqlEvalCount);

            // With the snapshot from the adapter `Unfulfilled`, we should be hitting
            // the network exactly once to get the record representation
            expect(networkAdapter.sentRequests.length).toBe(1);

            expect(snapshot.state).toEqual('Fulfilled');
            // Assert that what we get back in the snapshot represents the network data
            // and not the database record
            expect(snapshot.data.data.uiapi.query.User.edges[0].node.City.value).toEqual('Quebec');
        });

        it('should produce multi-node responses', async () => {
            const { graphQL: adapter } = await initEnv();

            // Make sure the user record we side load is not expired
            const [metadata] = makeMetadata([Number.MAX_SAFE_INTEGER]);

            // Stage the l2 cache
            await durableStore.set(
                keyBuilderRecord({ recordId: '001x0000004cKZHAA2' }),
                DefaultDurableSegment,
                {
                    data: {
                        ...mockAccount,
                        fields: {
                            Id: {
                                displayValue: null,
                                value: '001x0000004cKZHAA2',
                            },
                            Name: {
                                displayValue: null,
                                value: 'name 1',
                            },
                        },
                        id: '001x0000004cKZHAA2',
                    },
                    metadata,
                }
            );
            await durableStore.set(
                keyBuilderRecord({ recordId: '001x0000004cKZIAA2' }),
                DefaultDurableSegment,
                {
                    data: {
                        ...mockAccount,
                        fields: {
                            Id: {
                                displayValue: null,
                                value: '001x0000004cKZIAA2',
                            },
                            Name: {
                                displayValue: null,
                                value: 'name 2',
                            },
                        },
                        id: '001x0000004cKZIAA2',
                    },
                    metadata,
                }
            );
            await durableStore.flushPendingWork();

            // Invoke the adapter
            const snapshot = await adapter(
                {
                    query: parseAndVisit(/* GraphQL */ `
                        query {
                            uiapi {
                                query {
                                    Account(where: { Name: { like: "%name%" } }) @connection {
                                        edges {
                                            node @resource(type: "Record") {
                                                Name {
                                                    value
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    `),
                    variables: {},
                },
                { cachePolicy: { type: 'only-if-cached' } }
            );
            expect(snapshot.state).toEqual('Fulfilled');
            expect(snapshot.data.data.uiapi.query.Account.edges.length).toEqual(2);
        });

        it('should handle spanning record requests', async () => {
            const { graphQL } = await initEnv();

            // Stage the l2 cache
            const [metadata] = makeMetadata([Number.MAX_SAFE_INTEGER]);
            await durableStore.set(keyBuilderRecord({ recordId }), DefaultDurableSegment, {
                data: {
                    ...mockAccount,
                    ...{
                        fields: {
                            ...mockAccount.fields,
                            OwnerId: {
                                value: mockUser.id,
                            },
                        },
                    },
                },
                metadata,
            });
            await durableStore.set(
                keyBuilderRecord({ recordId: mockUser.id }),
                DefaultDurableSegment,
                { data: mockUser, metadata }
            );
            await durableStore.flushPendingWork();

            const snapshot = await graphQL(
                {
                    // Requesting the Owner (a User type) on an Account record triggers the spanning behavior
                    query: parseAndVisit(/* GraphQL */ `
                        query {
                            uiapi {
                                query {
                                    Account @connection {
                                        edges {
                                            node @resource(type: "Record") {
                                                Name {
                                                    value
                                                }
                                                Owner @resource(type: "Record") {
                                                    City {
                                                        value
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    `),
                    variables: {},
                },
                { cachePolicy: { type: 'only-if-cached' } }
            );

            expect(snapshot.state).toEqual('Fulfilled');
            expect(snapshot.data.data.uiapi.query.Account.edges[0].node.Owner.City.value).toEqual(
                'Montreal'
            );
        });

        it('should hit the network if we have never seen the query before', async () => {
            const { graphQL: adapter, networkAdapter } = await initEnv();
            const initialNetworkRequestCount = networkAdapter.sentRequests.length;

            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(mockData_Account_fields_Name),
            });

            const snapshot = await adapter({
                query: parseAndVisit(/* GraphQL */ `
                    query {
                        uiapi {
                            query {
                                Account @connection {
                                    edges {
                                        node @resource(type: "Record") {
                                            Name {
                                                value
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `),
                variables: {},
            });

            expect(networkAdapter.sentRequests.length).toEqual(initialNetworkRequestCount + 1);
            expect(snapshot.state).toEqual('Fulfilled');
            expect(snapshot.data.data.uiapi.query.Account.edges.length).toEqual(1);
        });

        describe('cache policy behavior', () => {
            const expectedEvalSnapshot = {
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
                                            _metadata: expect.any(Object),
                                        },
                                    },
                                    {
                                        node: {
                                            Id: '001xx000003Gn4WZZY',
                                            Name: {
                                                value: 'Burlington Fishing Surplus',
                                                displayValue: null,
                                            },
                                            _drafts: null,
                                            _metadata: expect.any(Object),
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                // The offline eval (correctly) omits this property when no errors were raised,
                // but this a point that differs from online behavior.
            };

            const config = {
                query: accountQuery('{ Name: { like: "Burlington%" } }'),
                variables: {},
            };

            const sideLoadRecord = async () => {
                // Stage the l2 cache with extra data for eval
                const otherId = '001xx000003Gn4WZZY';
                await durableStore.set(
                    keyBuilderRecord({ recordId: otherId }),
                    DefaultDurableSegment,
                    {
                        data: {
                            ...mockAccount,
                            id: otherId,
                            fields: { Name: { value: 'Burlington Fishing Surplus' } },
                            links: {},
                        },
                    }
                );
                await durableStore.flushPendingWork();
            };

            describe('default (stale-while-revalidate)', () => {
                it('should return stale eval snapshot and refreshes from network with expired data', async () => {
                    const { evaluateSqlSpy, networkAdapter, graphQL: adapter } = await initEnv();
                    await ingestQuery(
                        config.query,
                        networkAdapter,
                        mockData_Account_fields_Name,
                        adapter
                    );
                    const initialNetworkRequestCount = networkAdapter.sentRequests.length;
                    const initialEvalCount = evaluateSqlSpy.mock.calls.length;

                    // Stage the l2 cache with extra data for eval
                    await sideLoadRecord();

                    // Set the mock response
                    networkAdapter.setMockResponse({
                        status: 200,
                        headers: {},
                        body: JSONStringify(mockData_Account_fields_Name),
                    });

                    timekeeper.travel(Date.now() + RECORD_TTL + 1);

                    // Invoke the adapter
                    const snapshot = await adapter(config);

                    //Confirm L2 eval
                    expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);
                    // Confirm it hit the network because snapshot was stale
                    expect(networkAdapter.sentRequests.length).toBe(initialNetworkRequestCount + 1);

                    expect(snapshot.state).toEqual('Stale');

                    //Confirm the stale snapshot includes local eval results
                    expect(snapshot.data).toEqual(expectedEvalSnapshot);

                    //wait for async request to write to L2
                    await durableStore.waitForSet((key) => key.indexOf(recordId) > 0);
                    await durableStore.flushPendingWork();

                    const snapshot2 = await adapter(config);
                    expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 2);

                    expect(networkAdapter.sentRequests.length).toBe(initialNetworkRequestCount + 1);

                    expect(snapshot2.state).toEqual('Fulfilled');
                    expect(snapshot2.data).toEqual(expectedEvalSnapshot);
                });

                it('should return Fulfilled eval snapshot and does not refresh from network', async () => {
                    const { evaluateSqlSpy, networkAdapter, graphQL: adapter } = await initEnv();
                    await ingestQuery(
                        config.query,
                        networkAdapter,
                        mockData_Account_fields_Name,
                        adapter
                    );
                    const initialNetworkRequestCount = networkAdapter.sentRequests.length;
                    const initialEvalCount = evaluateSqlSpy.mock.calls.length;

                    // Stage the l2 cache with extra data for eval
                    await sideLoadRecord();

                    // Invoke the adapter
                    const snapshot = await adapter(config);

                    //Confirm L2 eval
                    expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);
                    expect(snapshot.state).toEqual('Fulfilled');
                    expect(snapshot.data).toEqual(expectedEvalSnapshot);

                    // Confirm it skipped the network because snapshot was fresh
                    expect(networkAdapter.sentRequests.length).toEqual(initialNetworkRequestCount);
                });
            });

            describe('cache-then-network', () => {
                it('should return eval snapshot and skip the network when data is unexpired', async () => {
                    const { evaluateSqlSpy, networkAdapter, graphQL: adapter } = await initEnv();
                    await ingestQuery(
                        config.query,
                        networkAdapter,
                        mockData_Account_fields_Name,
                        adapter
                    );
                    const initialNetworkRequestCount = networkAdapter.sentRequests.length;
                    const initialEvalCount = evaluateSqlSpy.mock.calls.length;

                    // Stage the l2 cache with extra data for eval
                    await sideLoadRecord();

                    // Invoke the adapter
                    const snapshot = await adapter(config, {
                        cachePolicy: {
                            type: 'cache-then-network',
                        },
                    });

                    //Confirm L2 eval
                    expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);
                    expect(snapshot.state).toEqual('Fulfilled');
                    expect(snapshot.data).toEqual(expectedEvalSnapshot);

                    // Confirm it skipped the network because snapshot was fresh
                    expect(networkAdapter.sentRequests.length).toBe(initialNetworkRequestCount);
                });

                it('should return network snapshot when data is expired', async () => {
                    const { evaluateSqlSpy, networkAdapter, graphQL: adapter } = await initEnv();
                    const initialEvalCount = evaluateSqlSpy.mock.calls.length;
                    await sideLoadRecord();

                    // Set the mock response
                    networkAdapter.setMockResponse({
                        status: 200,
                        headers: {},
                        body: JSONStringify(mockData_Account_fields_Name),
                    });

                    // Invoke the adapter
                    const snapshot = await adapter(config, {
                        cachePolicy: {
                            type: 'cache-then-network',
                        },
                    });

                    //Confirm that it hit the db (but found expired data)...
                    expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);

                    // Confirm it hit the network because snapshot was expired
                    expect(networkAdapter.sentRequests.length).toBe(1);

                    // ... and the snapshot was fulfilled from the network response then locally
                    // evaluated
                    expect(snapshot.state).toEqual('Fulfilled');
                    expect(snapshot.data).toEqual(expectedEvalSnapshot);
                });
            });

            describe('cache-and-network', () => {
                it('should eval against l2 and hit network, returning network snapshot when l2 is expired', async () => {
                    const { evaluateSqlSpy, networkAdapter, graphQL: adapter } = await initEnv();
                    const initialEvalCount = evaluateSqlSpy.mock.calls.length;

                    // Stage the l2 cache with extra data for eval
                    await sideLoadRecord();

                    // Set the mock response
                    networkAdapter.setMockResponse({
                        status: 200,
                        headers: {},
                        body: JSONStringify(mockData_Account_fields_Name),
                    });

                    // Invoke the adapter
                    const snapshot = await adapter(config, {
                        cachePolicy: {
                            type: 'cache-and-network',
                        },
                    });

                    //Confirm L2 eval
                    expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);
                    expect(snapshot.state).toEqual('Fulfilled');
                    expect(snapshot.data).toEqual(expectedEvalSnapshot);

                    // Confirm it hit the network
                    expect(networkAdapter.sentRequests.length).toBe(1);
                });
                it('should eval against l2 and hit network, returning eval snapshot when l2 is unexpired', async () => {
                    const { evaluateSqlSpy, networkAdapter, graphQL: adapter } = await initEnv();
                    await ingestQuery(
                        config.query,
                        networkAdapter,
                        mockData_Account_fields_Name,
                        adapter
                    );
                    const initialNetworkRequestCount = networkAdapter.sentRequests.length;
                    const initialEvalCount = evaluateSqlSpy.mock.calls.length;

                    // Stage the l2 cache with extra data for eval
                    await sideLoadRecord();

                    // Set the mock response
                    networkAdapter.setMockResponse({
                        status: 200,
                        headers: {},
                        body: JSONStringify(mockData_Account_fields_Name),
                    });

                    // Invoke the adapter
                    const snapshot = await adapter(config, {
                        cachePolicy: {
                            type: 'cache-and-network',
                        },
                    });

                    //Confirm L2 eval
                    expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);
                    expect(snapshot.data).toEqual(expectedEvalSnapshot);

                    // Confirm it hit the network
                    expect(networkAdapter.sentRequests.length).toBe(initialNetworkRequestCount + 1);
                });
            });
            describe('no-cache', () => {
                it('should not eval against l2 cache and return a network snapshot', async () => {
                    const { evaluateSqlSpy, networkAdapter, graphQL: adapter } = await initEnv();
                    const initialEvalCount = evaluateSqlSpy.mock.calls.length;

                    // Stage the l2 cache with extra data for eval
                    await sideLoadRecord();

                    // Set the mock response
                    networkAdapter.setMockResponse({
                        status: 200,
                        headers: {},
                        body: JSONStringify(mockData_Account_fields_Name),
                    });

                    // Invoke the adapter
                    const snapshot = await adapter(config, {
                        cachePolicy: {
                            type: 'no-cache',
                        },
                    });

                    //Confirm L2 eval
                    expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);
                    expect(snapshot.state).toEqual('Fulfilled');
                    expect(snapshot.data).toEqual(expectedEvalSnapshot);

                    // Confirm it hit the network
                    expect(networkAdapter.sentRequests.length).toBe(1);
                });
            });
            describe('only-if-cached', () => {
                it('should eval against l2 cache when data is unexpired', async () => {
                    const { evaluateSqlSpy, networkAdapter, graphQL: adapter } = await initEnv();
                    const initialEvalCount = evaluateSqlSpy.mock.calls.length;

                    // Stage the l2 cache with unexpired data
                    const [metadata] = makeMetadata([Number.MAX_SAFE_INTEGER]);
                    await durableStore.set(keyBuilderRecord({ recordId }), DefaultDurableSegment, {
                        data: { ...mockAccount, links: {} },
                        metadata,
                    });
                    await durableStore.flushPendingWork();

                    // Invoke the adapter
                    const snapshot = await adapter(config, {
                        cachePolicy: {
                            type: 'only-if-cached',
                        },
                    });

                    //Confirm L2 eval
                    expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);
                    expect(snapshot.state).toEqual('Fulfilled');
                    expect(snapshot.data.data.uiapi.query.Account.edges[0].node.Name.value).toEqual(
                        'Burlington Textiles Corp of America'
                    );

                    // Confirm it hit the network
                    expect(networkAdapter.sentRequests.length).toBe(0);
                });
                it('should return a fulfilled snapshot when record metadata is expired', async () => {
                    const { evaluateSqlSpy, networkAdapter, graphQL: adapter } = await initEnv();
                    const initialEvalCount = evaluateSqlSpy.mock.calls.length;

                    // Stage the l2 cache with expired data
                    const [metadata] = makeMetadata([0]);
                    await durableStore.set(keyBuilderRecord({ recordId }), DefaultDurableSegment, {
                        data: { ...mockAccount, links: {} },
                        metadata,
                    });
                    await durableStore.flushPendingWork();

                    // Invoke the adapter
                    const snapshot = await adapter(config, {
                        cachePolicy: {
                            type: 'only-if-cached',
                        },
                    });

                    //Confirm L2 eval
                    expect(evaluateSqlSpy).toHaveBeenCalledTimes(initialEvalCount + 1);
                    expect(snapshot.state).toEqual('Fulfilled');
                    expect(snapshot.data.data.uiapi.query.Account.edges[0].node.Name.value).toEqual(
                        'Burlington Textiles Corp of America'
                    );

                    // Confirm it skipped the network
                    expect(networkAdapter.sentRequests.length).toBe(0);
                });
            });
            describe.skip('valid-at', () => {
                it('should probably have a test...', () => {});
            });
        });
    });
});
