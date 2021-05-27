import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGraphqlNetwork, parseQuery } from 'graphql-test-util';
import { graphQLImperative } from 'lds-adapters-graphql';
import { luvio } from 'ldsEngine';

import GetRecord from '../lwc/get-record';

const MOCK_PREFIX = 'wire/graphql/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

/**
 * Note: for graphql adapter, karma tests don't have strict assertion on
 * the query format in the resource request. To verify query serialization,
 * using jest tests instead.
 */

describe('graphql', () => {
    describe('no cache', () => {
        it('hits network when no data is in the cache', async () => {
            const ast = parseQuery(`
                query {
                    uiapi {
                        query {
                            Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name { value, displayValue }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) {
                                edges {
                                    node {
                                        Id,
                                        WeakEtag,
                                        Name { value, displayValue}
                                        ...defaultRecordFields
                                    }
                                }
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename,
                    ApiName,
                    WeakEtag,
                    Id,
                    DisplayValue,
                    SystemModstamp { value }
                    LastModifiedById { value }
                    LastModifiedDate { value }
                    RecordTypeId(fallback: true) { value }
                }
            `;

            const networkData = getMock('RecordQuery-Account-fields-Name');
            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Name: {
                                                value: 'Account1',
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
            };

            mockGraphqlNetwork(
                {
                    query: expectedQuery,
                    variables: {},
                },
                networkData
            );

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const pending = graphQLImperative(graphqlConfig);
            const snapshot = await luvio.resolvePendingSnapshot(pending);
            expect(snapshot.data).toEqual(expectedData);
        });
    });

    describe('caching', () => {
        it('should not hit network when all data is in cache', async () => {
            const ast = parseQuery(`
                query {
                    uiapi {
                        query {
                            Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name { value, displayValue }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) {
                                edges {
                                    node {
                                        Id,
                                        WeakEtag,
                                        Name { value, displayValue }
                                        ...defaultRecordFields
                                    }
                                }
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename,
                    ApiName,
                    WeakEtag,
                    Id,
                    DisplayValue,
                    SystemModstamp { value }
                    LastModifiedById { value }
                    LastModifiedDate { value }
                    RecordTypeId(fallback: true) { value }
                }
            `;

            const networkData = getMock('RecordQuery-Account-fields-Name');
            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Name: {
                                                value: 'Account1',
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
            };

            mockGraphqlNetwork(
                {
                    query: expectedQuery,
                    variables: {},
                },
                networkData
            );

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const pending = graphQLImperative(graphqlConfig);
            const snapshot = await luvio.resolvePendingSnapshot(pending);
            expect(snapshot.data).toEqual(expectedData);

            const secondSnapshot = graphQLImperative(graphqlConfig);
            expect(secondSnapshot.data).toEqual(expectedData);
        });

        it('should not hit network when subset of already cached data is requested', async () => {
            const ast = parseQuery(`
                query {
                    uiapi {
                        query {
                            Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name { value, displayValue }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) {
                                edges {
                                    node {
                                        Id,
                                        WeakEtag,
                                        Name { value, displayValue}
                                        ...defaultRecordFields
                                    }
                                }
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename,
                    ApiName,
                    WeakEtag,
                    Id,
                    DisplayValue,
                    SystemModstamp { value }
                    LastModifiedById { value }
                    LastModifiedDate { value }
                    RecordTypeId(fallback: true) { value }
                }
            `;

            const networkData = getMock('RecordQuery-Account-fields-Name');
            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Name: {
                                                value: 'Account1',
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                errors: [],
            };

            mockGraphqlNetwork(
                {
                    query: expectedQuery,
                    variables: {},
                },
                networkData
            );

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const pending = graphQLImperative(graphqlConfig);
            await luvio.resolvePendingSnapshot(pending);
            const cachedDataAst = parseQuery(`
                query {
                    uiapi {
                        query {
                            Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name { value }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const secondSnapshot = graphQLImperative({
                query: cachedDataAst,
                variables: {},
            });
            expect(secondSnapshot.data).toEqual(expectedData);
        });

        it('should hit network when some data is unfulfilled', async () => {
            const ast = parseQuery(`
                query {
                    uiapi {
                        query {
                            Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name { value, displayValue }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const ast2 = parseQuery(`
                query {
                    uiapi {
                        query {
                            Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Phone { value, displayValue }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQueryOne = `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) {
                                edges {
                                    node {
                                        Id,
                                        WeakEtag,
                                        Name { value, displayValue }
                                        ...defaultRecordFields
                                    }
                                }
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename,
                    ApiName,
                    WeakEtag,
                    Id,
                    DisplayValue,
                    SystemModstamp { value }
                    LastModifiedById { value }
                    LastModifiedDate { value }
                    RecordTypeId(fallback: true) { value }
                }
            `;

            const expectedQueryTwo = `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) {
                                edges {
                                    node {
                                        Id,
                                        WeakEtag,
                                        Phone { value, displayValue }
                                        ...defaultRecordFields
                                    }
                                }
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename,
                    ApiName,
                    WeakEtag,
                    Id,
                    DisplayValue,
                    SystemModstamp { value }
                    LastModifiedById { value }
                    LastModifiedDate { value }
                    RecordTypeId(fallback: true) { value }
                }
            `;

            const networkData = getMock('RecordQuery-Account-fields-Name');
            const networkDataTwo = getMock('RecordQuery-Account-fields-Phone');
            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Name: {
                                                value: 'Account1',
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
            };

            const expectedDataTwo = {
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Phone: {
                                                value: '1234567',
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
            };

            mockGraphqlNetwork(
                {
                    query: expectedQueryOne,
                    variables: {},
                },
                networkData
            );

            mockGraphqlNetwork(
                {
                    query: expectedQueryTwo,
                    variables: {},
                },
                networkDataTwo
            );

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const secondGraphQLConfig = {
                query: ast2,
                variables: {},
            };

            const pending = graphQLImperative(graphqlConfig);
            const snapshot = await luvio.resolvePendingSnapshot(pending);
            expect(snapshot.data).toEqual(expectedData);

            const pending2 = graphQLImperative(secondGraphQLConfig);
            const snapshot2 = await luvio.resolvePendingSnapshot(pending2);
            expect(snapshot2.data).toEqual(expectedDataTwo);
        });

        it('should not hit network when merged data in cache is requested', async () => {
            const ast = parseQuery(`
                query {
                    uiapi {
                        query {
                            Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name { value, displayValue }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const ast2 = parseQuery(`
                query {
                    uiapi {
                        query {
                            Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Phone { value, displayValue }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQueryOne = `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) {
                                edges {
                                    node {
                                        Id,
                                        WeakEtag,
                                        Name { value, displayValue }
                                        ...defaultRecordFields
                                    }
                                }
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename,
                    ApiName,
                    WeakEtag,
                    Id,
                    DisplayValue,
                    SystemModstamp { value }
                    LastModifiedById { value }
                    LastModifiedDate { value }
                    RecordTypeId(fallback: true) { value }
                }
            `;

            const expectedQueryTwo = `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) {
                                edges {
                                    node {
                                        Id,
                                        WeakEtag,
                                        Phone { value, displayValue }
                                        ...defaultRecordFields
                                    }
                                }
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename,
                    ApiName,
                    WeakEtag,
                    Id,
                    DisplayValue,
                    SystemModstamp { value }
                    LastModifiedById { value }
                    LastModifiedDate { value }
                    RecordTypeId(fallback: true) { value }
                }
            `;

            const networkData = getMock('RecordQuery-Account-fields-Name');
            const networkDataTwo = getMock('RecordQuery-Account-fields-Phone');
            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Name: {
                                                value: 'Account1',
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
            };

            const expectedDataTwo = {
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Phone: {
                                                value: '1234567',
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
            };

            mockGraphqlNetwork(
                {
                    query: expectedQueryOne,
                    variables: {},
                },
                networkData
            );

            mockGraphqlNetwork(
                {
                    query: expectedQueryTwo,
                    variables: {},
                },
                networkDataTwo
            );

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const secondGraphQLConfig = {
                query: ast2,
                variables: {},
            };

            const pending = graphQLImperative(graphqlConfig);
            const snapshot = await luvio.resolvePendingSnapshot(pending);
            expect(snapshot.data).toEqual(expectedData);

            const pending2 = graphQLImperative(secondGraphQLConfig);
            const snapshot2 = await luvio.resolvePendingSnapshot(pending2);
            expect(snapshot2.data).toEqual(expectedDataTwo);

            const cachedDataAst = parseQuery(`
                query {
                    uiapi {
                        query {
                            Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name { value }
                                        Phone { value }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedDataCached = {
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Name: {
                                                value: 'Account1',
                                            },
                                            Phone: {
                                                value: '1234567',
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                errors: [],
            };

            const thirdSnapshot = graphQLImperative({
                query: cachedDataAst,
                variables: {},
            });
            expect(thirdSnapshot.data).toEqual(expectedDataCached);
        });
    });

    describe('missing links', () => {
        it('should handle when nested spanning field is not present', async () => {
            const ast = parseQuery(`
                query {
                    uiapi {
                        query {
                            Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name { value, displayValue }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const ast2 = parseQuery(`
                {
                    uiapi {
                        query {
                            Account(where: {Name: {like: "Account1"}}
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Owner @resource(type: "Record") {
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
                }
            `);

            const expectedQueryOne = `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) {
                                edges {
                                    node {
                                        Id,
                                        WeakEtag,
                                        Name { value, displayValue }
                                        ...defaultRecordFields
                                    }
                                }
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename,
                    ApiName,
                    WeakEtag,
                    Id,
                    DisplayValue,
                    SystemModstamp { value }
                    LastModifiedById { value }
                    LastModifiedDate { value }
                    RecordTypeId(fallback: true) { value }
                }
            `;

            const expectedQueryTwo = `
            {
                uiapi {
                  query {
                    Account(where: {Name: {like: "Account1"}}) {
                      edges {
                        node {
                          Id,
                          WeakEtag,
                          Owner {
                            Id,
                            WeakEtag,
                            Name {
                              value
                              displayValue
                            }
                            ...defaultRecordFields
                          }
                          ...defaultRecordFields
                        }
                      }
                    }
                  }
                }
              }

              fragment defaultRecordFields on Record {
                __typename
                ApiName
                WeakEtag
                Id
                DisplayValue
                SystemModstamp {
                  value
                }
                LastModifiedById {
                  value
                }
                LastModifiedDate {
                  value
                }
                RecordTypeId(fallback: true) {
                  value
                }
              }
            `;

            const networkData = getMock('RecordQuery-Account-fields-Name');
            const networkDataTwo = getMock('RecordQuery-Account-fields-Owner.Name');
            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Name: {
                                                value: 'Account1',
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
            };

            const expectedDataTwo = {
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Owner: {
                                                Name: {
                                                    value: 'Admin User',
                                                    displayValue: null,
                                                },
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                errors: [],
            };

            mockGraphqlNetwork(
                {
                    query: expectedQueryOne,
                    variables: {},
                },
                networkData
            );

            mockGraphqlNetwork(
                {
                    query: expectedQueryTwo,
                    variables: {},
                },
                networkDataTwo
            );

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const secondGraphQLConfig = {
                query: ast2,
                variables: {},
            };

            const pending = graphQLImperative(graphqlConfig);
            const snapshot = await luvio.resolvePendingSnapshot(pending);
            expect(snapshot.data).toEqual(expectedData);

            const pending2 = graphQLImperative(secondGraphQLConfig);
            const snapshot2 = await luvio.resolvePendingSnapshot(pending2);
            expect(snapshot2.data).toEqual(expectedDataTwo);
        });
    });

    describe('Record representation', () => {
        describe('getRecord', () => {
            it('should be a CACHE HIT if getRecord requests a record with same fields fetched from GQL', async () => {
                const ast = parseQuery(`
                    query {
                        uiapi {
                            query {
                                Account(
                                    where: { Name: { like: "Account1" } }
                                ) @connection {
                                    edges {
                                        node @resource(type: "Record") {
                                            Name { value, displayValue }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `);

                const expectedQuery = `
                    query {
                        uiapi {
                            query {
                                Account(where: { Name: { like: "Account1" } }) {
                                    edges {
                                        node {
                                            Id,
                                            WeakEtag,
                                            Name { value, displayValue }
                                            ...defaultRecordFields
                                        }
                                    }
                                }
                            }
                        }
                    }
                    fragment defaultRecordFields on Record {
                        __typename,
                        ApiName,
                        WeakEtag,
                        Id,
                        DisplayValue,
                        SystemModstamp { value }
                        LastModifiedById { value }
                        LastModifiedDate { value }
                        RecordTypeId(fallback: true) { value }
                    }
                `;

                const networkData = getMock('RecordQuery-Account-fields-Name');
                const expectedData = {
                    data: {
                        uiapi: {
                            query: {
                                Account: {
                                    edges: [
                                        {
                                            node: {
                                                Name: {
                                                    value: 'Account1',
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
                };

                mockGraphqlNetwork(
                    {
                        query: expectedQuery,
                        variables: {},
                    },
                    networkData
                );

                const graphqlConfig = {
                    query: ast,
                    variables: {},
                };

                const pending = graphQLImperative(graphqlConfig);
                const snapshot = await luvio.resolvePendingSnapshot(pending);
                expect(snapshot.data).toEqual(expectedData);

                const getRecord = await setupElement(
                    {
                        recordId: '001RM000004uuhnYAA',
                        fields: ['Account.Name'],
                    },
                    GetRecord
                );

                expect(getRecord.getWiredData()).toEqualSnapshotWithoutEtags({
                    apiName: 'Account',
                    id: '001RM000004uuhnYAA',
                    childRelationships: {},
                    weakEtag: 1615493739000,
                    fields: {
                        Name: {
                            value: 'Account1',
                            displayValue: null,
                        },
                    },
                    systemModstamp: '2021-03-11T20:15:39.000Z',
                    lastModifiedById: '005RM000002492xYAA',
                    lastModifiedDate: '2021-03-11T20:15:39.000Z',
                    recordTypeId: '012RM000000E79WYAS',
                    recordTypeInfo: null,
                });
            });
        });
    });
});
