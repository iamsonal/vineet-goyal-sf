import { getMock as globalGetMock, setupElement } from 'test-util';
import sinon from 'sinon';
import {
    mockGraphqlNetwork,
    parseQuery,
    expireRecords,
    mockGetRecordNetwork,
} from 'graphql-test-util';
import { graphQLImperative } from 'lds-adapters-graphql';
import { luvio } from 'lds-engine';

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
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);
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
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);

            const secondSnapshot = graphQLImperative(graphqlConfig);
            expect(secondSnapshot.data).toEqualSnapshotWithoutEtags(expectedData);
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
            expect(secondSnapshot.data).toEqualSnapshotWithoutEtags(expectedData);
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
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);

            const pending2 = graphQLImperative(secondGraphQLConfig);
            const snapshot2 = await luvio.resolvePendingSnapshot(pending2);
            expect(snapshot2.data).toEqualSnapshotWithoutEtags(expectedDataTwo);
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
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);

            const pending2 = graphQLImperative(secondGraphQLConfig);
            const snapshot2 = await luvio.resolvePendingSnapshot(pending2);
            expect(snapshot2.data).toEqualSnapshotWithoutEtags(expectedDataTwo);

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
            expect(thirdSnapshot.data).toEqualSnapshotWithoutEtags(expectedDataCached);
        });
    });

    describe('aliasing', () => {
        it('should not hit network when all data is in cache', async () => {
            const astOne = parseQuery(`
                query {
                    ApiOne: uiapi {
                        query {
                            AccountOne: Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        NameOne: Name { value, displayValue }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const astTwo = parseQuery(`
                query {
                    ApiTwo: uiapi {
                        query {
                            AccountTwo: Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        NameTwo: Name { value, displayValue }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedDataOne = {
                data: {
                    ApiOne: {
                        query: {
                            AccountOne: {
                                edges: [
                                    {
                                        node: {
                                            NameOne: {
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
                    ApiTwo: {
                        query: {
                            AccountTwo: {
                                edges: [
                                    {
                                        node: {
                                            NameTwo: {
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

            const expectedQuery = `
                query {
                    ApiOne: uiapi {
                        query {
                            AccountOne: Account(where: { Name: { like: "Account1" } }) {
                                edges {
                                    node {
                                        NameOne: Name { value, displayValue }
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

            const networkData = getMock('RecordQuery-Account-fields-Name-aliased');
            mockGraphqlNetwork(
                {
                    query: expectedQuery,
                    variables: {},
                },
                networkData
            );

            const graphqlConfigOne = {
                query: astOne,
                variables: {},
            };

            const graphqlConfigTwo = {
                query: astTwo,
                variables: {},
            };

            const pending = graphQLImperative(graphqlConfigOne);
            const snapshot = await luvio.resolvePendingSnapshot(pending);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedDataOne);

            const secondSnapshot = await graphQLImperative(graphqlConfigTwo);
            expect(secondSnapshot.data).toEqualSnapshotWithoutEtags(expectedDataTwo);
        });

        it('should not hit network when merged data in cache is requested', async () => {
            const ast = parseQuery(`
                query {
                    ApiOne: uiapi {
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
                    ApiTwo: uiapi {
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

            const expectedData = {
                data: {
                    ApiOne: {
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
                    ApiTwo: {
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

            const expectedQuery = `
                query {
                    ApiOne: uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) {
                                edges {
                                    node {
                                        Name { value, displayValue }
                                        ...defaultRecordFields
                                    }
                                }
                            }
                        }
                    }
                    ApiTwo: uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) {
                                edges {
                                    node {
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

            const networkData = getMock('RecordQuery-Account-fields-Name-Phone-aliased');

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
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);

            const cachedDataAst = parseQuery(`
                query {
                    ApiThree: uiapi {
                        query {
                            AccountThree: Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        NameThree: Name { value }
                                        PhoneThree: Phone { value }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedDataCached = {
                data: {
                    ApiThree: {
                        query: {
                            AccountThree: {
                                edges: [
                                    {
                                        node: {
                                            NameThree: {
                                                value: 'Account1',
                                            },
                                            PhoneThree: {
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

            const secondSnapshot = await graphQLImperative({
                query: cachedDataAst,
                variables: {},
            });
            expect(secondSnapshot.data).toEqualSnapshotWithoutEtags(expectedDataCached);
        });

        it('should not hit network when data from multiple requests in cache is requested', async () => {
            const astOne = parseQuery(`
                query {
                    ApiOne: uiapi {
                        query {
                            AccountOne: Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        NameOne: Name { value, displayValue }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const astTwo = parseQuery(`
                query {
                    ApiTwo: uiapi {
                        query {
                            AccountTwo: Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        PhoneTwo: Phone { value, displayValue }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedDataOne = {
                data: {
                    ApiOne: {
                        query: {
                            AccountOne: {
                                edges: [
                                    {
                                        node: {
                                            NameOne: {
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
                    ApiTwo: {
                        query: {
                            AccountTwo: {
                                edges: [
                                    {
                                        node: {
                                            PhoneTwo: {
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

            const expectedQueryOne = `
                query {
                    ApiOne: uiapi {
                        query {
                            AccountOne: Account(where: { Name: { like: "Account1" } }) {
                                edges {
                                    node {
                                        NameOne: Name { value, displayValue }
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
                    ApiTwo: uiapi {
                        query {
                            AccountTwo: Account(where: { Name: { like: "Account1" } }) {
                                edges {
                                    node {
                                        PhoneTwo: Phone { value, displayValue }
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

            const networkDataOne = getMock('RecordQuery-Account-fields-Name-aliased');
            const networkDataTwo = getMock('RecordQuery-Account-fields-Phone-aliased');

            mockGraphqlNetwork(
                {
                    query: expectedQueryOne,
                    variables: {},
                },
                networkDataOne
            );

            mockGraphqlNetwork(
                {
                    query: expectedQueryTwo,
                    variables: {},
                },
                networkDataTwo
            );

            const graphqlConfigOne = {
                query: astOne,
                variables: {},
            };

            const graphQLConfigTwo = {
                query: astTwo,
                variables: {},
            };

            const pending = graphQLImperative(graphqlConfigOne);
            const snapshot = await luvio.resolvePendingSnapshot(pending);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedDataOne);

            const pending2 = graphQLImperative(graphQLConfigTwo);
            const snapshot2 = await luvio.resolvePendingSnapshot(pending2);
            expect(snapshot2.data).toEqualSnapshotWithoutEtags(expectedDataTwo);

            const cachedDataAst = parseQuery(`
                query {
                    ApiThree: uiapi {
                        query {
                            AccountThree: Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        NameThree: Name { value }
                                        PhoneThree: Phone { value }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedDataCached = {
                data: {
                    ApiThree: {
                        query: {
                            AccountThree: {
                                edges: [
                                    {
                                        node: {
                                            NameThree: {
                                                value: 'Account1',
                                            },
                                            PhoneThree: {
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

            const thirdSnapshot = await graphQLImperative({
                query: cachedDataAst,
                variables: {},
            });
            expect(thirdSnapshot.data).toEqualSnapshotWithoutEtags(expectedDataCached);
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
                          Owner {
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
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);

            const pending2 = graphQLImperative(secondGraphQLConfig);
            const snapshot2 = await luvio.resolvePendingSnapshot(pending2);
            expect(snapshot2.data).toEqualSnapshotWithoutEtags(expectedDataTwo);
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
                expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);

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

            it('should emit changes to graphql adapter when getRecord returns updated fields', async () => {
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
                const updatedRecordRep = getMock('RecordRepresentation-Account-fields-Name');

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

                mockGetRecordNetwork(
                    {
                        recordId: '001RM000004uuhnYAA',
                        fields: ['Account.Name'],
                    },
                    updatedRecordRep
                );

                const pending = graphQLImperative(graphqlConfig);
                const snapshot = await luvio.resolvePendingSnapshot(pending);
                const spy = sinon.spy();
                luvio.storeSubscribe(snapshot, spy);

                expireRecords();
                await setupElement(
                    {
                        recordId: '001RM000004uuhnYAA',
                        fields: ['Account.Name'],
                    },
                    GetRecord
                );
                expect(spy.callCount).toBe(1);

                expect(spy.firstCall.args[0].data).toEqualSnapshotWithoutEtags({
                    data: {
                        uiapi: {
                            query: {
                                Account: {
                                    edges: [
                                        {
                                            node: {
                                                Name: {
                                                    value: updatedRecordRep.fields.Name.value,
                                                    displayValue:
                                                        updatedRecordRep.fields.Name.displayValue,
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

        describe('Tracked fields', () => {
            it('should fetch record with all tracked fields collected from getRecord wire', async () => {
                const query = parseQuery(`
                    query {
                        uiapi {
                            query {
                                Opportunity(where: {Name: {eq: "Opp1"}}) @connection {
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

                const expectedQuery = `
                    query {
                        uiapi {
                            query {
                                Opportunity(where: {Name: {eq: "Opp1"}}) {
                                    edges {
                                        node {
                                            Name {
                                                value
                                                displayValue
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
                        SystemModstamp { value }
                        LastModifiedById { value }
                        LastModifiedDate { value }
                        RecordTypeId(fallback: true) { value }
                    }
                `;

                const networkData = getMock('RecordQuery-Opportunity-fields-Name');
                const recordRepMock = getMock(
                    'RecordRepresentation-Opportunity-fields-Opportunity.Id'
                );
                const recordRepUpdated = getMock(
                    'RecordRepresentation-Opportunity-fields-Opportunity.Name,Opportunity.Id'
                );

                mockGetRecordNetwork(
                    {
                        recordId: recordRepMock.id,
                        fields: ['Opportunity.Id'],
                    },
                    recordRepMock
                );

                mockGetRecordNetwork(
                    {
                        recordId: recordRepMock.id,
                        optionalFields: ['Opportunity.Id', 'Opportunity.Name'],
                    },
                    recordRepUpdated
                );

                mockGraphqlNetwork(
                    {
                        query: expectedQuery,
                        variables: {},
                    },
                    networkData
                );

                const pending = graphQLImperative({
                    query,
                    variables: {},
                });
                const snapshot = await luvio.resolvePendingSnapshot(pending);
                const spy = sinon.spy();
                luvio.storeSubscribe(snapshot, spy);

                await setupElement(
                    {
                        recordId: recordRepMock.id,
                        fields: ['Opportunity.Id'],
                    },
                    GetRecord
                );

                expect(spy.callCount).toBe(1);
                expect(spy.lastCall.args[0].data).toEqual({
                    data: {
                        uiapi: {
                            query: {
                                Opportunity: {
                                    edges: [
                                        {
                                            node: {
                                                Name: {
                                                    value: 'Opp1-changed1',
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

    describe('null spanning records', () => {
        it('should ingest null spanning records correctly', async () => {
            const ast = parseQuery(`
                {
                    uiapi {
                        query {
                            Account(where: {Name: {like: "Add One More Account"}}) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Parent @resource(type: "Record") {
                                            Name {
                                                value
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = `
                {
                    uiapi {
                        query {
                            Account(where: {Name: {like: "Add One More Account"}}) {
                                edges {
                                    node {
                                        Parent {
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

            const mock = getMock('RecordQuery-Account-fields-null-Parent');

            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                edges: [
                                    {
                                        node: {
                                            Parent: null,
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
                mock
            );

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const pending = graphQLImperative(graphqlConfig);
            const snapshot = await luvio.resolvePendingSnapshot(pending);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);
        });
    });

    describe('Errors', () => {
        it('should emit error responses to the user', async () => {
            const mock = getMock('ErrorQuery-invalid-field');
            const query = `
                {
                    uiapi {
                        query {
                            asd
                        }
                    }
                }
            `;
            const invalidQuery = parseQuery(query);

            mockGraphqlNetwork(
                {
                    query: query,
                    variables: {},
                },
                mock
            );

            const graphqlConfig = {
                query: invalidQuery,
                variables: {},
            };

            const pending = await graphQLImperative(graphqlConfig);
            const snapshot = await luvio.resolvePendingSnapshot(pending);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(mock);
        });
    });
});
