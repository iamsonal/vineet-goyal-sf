import { getMock as globalGetMock } from 'test-util';
import { mockGraphqlNetwork, parseQuery } from 'graphql-test-util';

import { graphQLImperative } from 'lds-adapters-graphql';

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

            const snapshot = await graphQLImperative(graphqlConfig);
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

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqual(expectedData);

            const secondSnapshot = await graphQLImperative(graphqlConfig);
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

            await graphQLImperative(graphqlConfig);
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

            const secondSnapshot = await graphQLImperative({
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

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqual(expectedData);

            const snapshot2 = await graphQLImperative(secondGraphQLConfig);
            expect(snapshot2.data).toEqual(expectedDataTwo);
        });
    });
});
