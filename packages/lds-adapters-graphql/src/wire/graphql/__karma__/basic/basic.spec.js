import { getMock as globalGetMock, setupElement } from 'test-util';
import sinon from 'sinon';
import {
    mockGraphqlNetwork,
    parseQuery,
    expireRecords,
    mockGetRecordNetwork,
    mockGraphqlNetworkErrorOnce,
} from 'graphql-test-util';
import { graphQLImperative } from 'lds-adapters-graphql';
import { luvio } from 'lds-engine';

import GetRecord from '../lwc/get-record';

import QueryAccountFieldsName from './query-data/GraphQL-Account-fields-Name/query';
import QueryAccountFieldsNameAliased from './query-data/GraphQL-Account-fields-Name-aliased/query';
import QueryAccountFieldsNamePhoneAliased from './query-data/GraphQL-Account-fields-Name-Phone-aliased/query';
import QueryAccountFieldsNameVariablesAccount1 from './query-data/GraphQL-Account-fields-Name-variables-Account1/query';
import QueryAccountFieldsPhone from './query-data/GraphQL-Account-fields-Phone/query';
import QueryAccountFieldsPhoneAliased from './query-data/GraphQL-Account-fields-Phone-aliased/query';
import QueryAccountChildRelationshipsOpportunity from './query-data/GraphQL-Account-childRelationships-Opportunities/query';
import QueryAccountFieldsNullParent from './query-data/GraphQL-Account-fields-null-Parent/query';
import QueryErrorInvalidField from './query-data/GraphQL-Error-Invalid-Field/query';

const MOCK_PREFIX = 'wire/graphql/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function getMockQueryData(queryName) {
    return globalGetMock(`wire/graphql/__karma__/basic/query-data/${queryName}/mockData`);
}

/**
 * Note: for graphql adapter, karma tests don't have strict assertion on
 * the query format in the resource request. To verify query serialization,
 * using jest tests instead.
 */

describe('graphql', () => {
    describe('no cache', () => {
        it('hits network when no data is in the cache', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
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

            const networkData = getMockQueryData('GraphQL-Account-fields-Name');
            mockGraphqlNetwork(QueryAccountFieldsName, networkData);

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);
        });

        it('should return scalars on @connection types correctly', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
                                __typename
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

            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            Account: {
                                __typename: 'AccountConnection',
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

            const networkData = getMockQueryData('GraphQL-Account-fields-Name');
            mockGraphqlNetwork(QueryAccountFieldsName, networkData);

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);
        });
    });

    describe('caching', () => {
        it('should not hit network when all data is in cache', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
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

            const networkData = getMockQueryData('GraphQL-Account-fields-Name');
            mockGraphqlNetwork(QueryAccountFieldsName, networkData);

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);

            const secondSnapshot = graphQLImperative(graphqlConfig);
            expect(secondSnapshot.data).toEqualSnapshotWithoutEtags(expectedData);
        });

        it('should not hit network when subset of already cached data is requested', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
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

            const networkData = getMockQueryData('GraphQL-Account-fields-Name');
            mockGraphqlNetwork(QueryAccountFieldsName, networkData);

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            await graphQLImperative(graphqlConfig);
            const cachedDataAst = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
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
            `);

            const secondSnapshot = graphQLImperative({
                query: cachedDataAst,
                variables: {},
            });
            expect(secondSnapshot.data).toEqualSnapshotWithoutEtags(expectedData);
        });

        it('should hit network when some data is unfulfilled', async () => {
            const astFieldName = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
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

            const astFieldPhone = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Phone {
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

            const expectedDataFieldName = {
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

            const expectedDataFieldPhone = {
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

            const networkDataFieldName = getMockQueryData('GraphQL-Account-fields-Name');
            mockGraphqlNetwork(QueryAccountFieldsName, networkDataFieldName);

            const networkDataFieldPhone = getMockQueryData('GraphQL-Account-fields-Phone');
            mockGraphqlNetwork(QueryAccountFieldsPhone, networkDataFieldPhone);

            const graphqlConfig = {
                query: astFieldName,
                variables: {},
            };

            const secondGraphQLConfig = {
                query: astFieldPhone,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedDataFieldName);

            const snapshot2 = await graphQLImperative(secondGraphQLConfig);
            expect(snapshot2.data).toEqualSnapshotWithoutEtags(expectedDataFieldPhone);
        });

        it('should not hit network when merged data in cache is requested', async () => {
            const astFieldName = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
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

            const astFieldPhone = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Phone {
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

            const expectedDataFieldName = {
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

            const expectedDataFieldPhone = {
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

            const networkDataFieldName = getMockQueryData('GraphQL-Account-fields-Name');
            mockGraphqlNetwork(QueryAccountFieldsName, networkDataFieldName);

            const networkDataFieldPhone = getMockQueryData('GraphQL-Account-fields-Phone');
            mockGraphqlNetwork(QueryAccountFieldsPhone, networkDataFieldPhone);

            const graphqlConfig = {
                query: astFieldName,
                variables: {},
            };

            const secondGraphQLConfig = {
                query: astFieldPhone,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedDataFieldName);

            const snapshot2 = await graphQLImperative(secondGraphQLConfig);
            expect(snapshot2.data).toEqualSnapshotWithoutEtags(expectedDataFieldPhone);

            const cachedDataAst = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name {
                                            value
                                        }
                                        Phone {
                                            value
                                        }
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
            const astOne = parseQuery(/* GraphQL */ `
                query {
                    ApiOne: uiapi {
                        query {
                            AccountOne: Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        NameOne: Name {
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

            const astTwo = parseQuery(/* GraphQL */ `
                query {
                    ApiTwo: uiapi {
                        query {
                            AccountTwo: Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        NameTwo: Name {
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

            const networkData = getMockQueryData('GraphQL-Account-fields-Name-aliased');
            mockGraphqlNetwork(QueryAccountFieldsNameAliased, networkData);

            const graphqlConfigOne = {
                query: astOne,
                variables: {},
            };

            const graphqlConfigTwo = {
                query: astTwo,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfigOne);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedDataOne);

            const secondSnapshot = await graphQLImperative(graphqlConfigTwo);
            expect(secondSnapshot.data).toEqualSnapshotWithoutEtags(expectedDataTwo);
        });

        it('should not hit network when merged data in cache is requested', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    ApiOne: uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
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
                    ApiTwo: uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Phone {
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

            const networkData = getMockQueryData('GraphQL-Account-fields-Name-Phone-aliased');
            mockGraphqlNetwork(QueryAccountFieldsNamePhoneAliased, networkData);

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);

            const cachedDataAst = parseQuery(/* GraphQL */ `
                query {
                    ApiThree: uiapi {
                        query {
                            AccountThree: Account(where: { Name: { like: "Account1" } })
                                @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        NameThree: Name {
                                            value
                                        }
                                        PhoneThree: Phone {
                                            value
                                        }
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
            const astOne = parseQuery(/* GraphQL */ `
                query {
                    ApiOne: uiapi {
                        query {
                            AccountOne: Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        NameOne: Name {
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

            const astTwo = parseQuery(/* GraphQL */ `
                query {
                    ApiTwo: uiapi {
                        query {
                            AccountTwo: Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        PhoneTwo: Phone {
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

            const networkDataOne = getMockQueryData('GraphQL-Account-fields-Name-aliased');
            mockGraphqlNetwork(QueryAccountFieldsNameAliased, networkDataOne);

            const networkDataTwo = getMockQueryData('GraphQL-Account-fields-Phone-aliased');
            mockGraphqlNetwork(QueryAccountFieldsPhoneAliased, networkDataTwo);

            const graphqlConfigOne = {
                query: astOne,
                variables: {},
            };

            const graphQLConfigTwo = {
                query: astTwo,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfigOne);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedDataOne);

            const snapshot2 = await graphQLImperative(graphQLConfigTwo);
            expect(snapshot2.data).toEqualSnapshotWithoutEtags(expectedDataTwo);

            const cachedDataAst = parseQuery(/* GraphQL */ `
                query {
                    ApiThree: uiapi {
                        query {
                            AccountThree: Account(where: { Name: { like: "Account1" } })
                                @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        NameThree: Name {
                                            value
                                        }
                                        PhoneThree: Phone {
                                            value
                                        }
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
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
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

            const ast2 = parseQuery(/* GraphQL */ `
                {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
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

            const expectedQueryOne = /* GraphQL */ `
                query {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            Account(where: { Name: { like: "Account1" } }) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Name {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        ...defaultRecordFields
                                    }
                                    cursor
                                }
                                pageInfo {
                                    hasNextPage
                                    hasPreviousPage
                                }
                                totalCount
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

            const expectedQueryTwo = /* GraphQL */ `
                query {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            Account(where: { Name: { like: "Account1" } }) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Owner {
                                            Name {
                                                __typename
                                                value
                                                displayValue
                                            }
                                            ...defaultRecordFields
                                        }
                                        ...defaultRecordFields
                                    }
                                    cursor
                                }
                                pageInfo {
                                    hasNextPage
                                    hasPreviousPage
                                }
                                totalCount
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

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);

            const snapshot2 = await graphQLImperative(secondGraphQLConfig);
            expect(snapshot2.data).toEqualSnapshotWithoutEtags(expectedDataTwo);
        });
    });

    describe('Record representation', () => {
        describe('getRecord', () => {
            it('should be a CACHE HIT if getRecord requests a record with same fields fetched from GQL', async () => {
                const ast = parseQuery(/* GraphQL */ `
                    query {
                        uiapi {
                            query {
                                Account(where: { Name: { like: "Account1" } }) @connection {
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

                const expectedQuery = /* GraphQL */ `
                    query {
                        __typename
                        uiapi {
                            __typename
                            query {
                                __typename
                                Account(where: { Name: { like: "Account1" } }) {
                                    __typename
                                    edges {
                                        __typename
                                        node {
                                            Name {
                                                __typename
                                                value
                                                displayValue
                                            }
                                            ...defaultRecordFields
                                        }
                                        cursor
                                    }
                                    pageInfo {
                                        hasNextPage
                                        hasPreviousPage
                                    }
                                    totalCount
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
                const ast = parseQuery(/* GraphQL */ `
                    query {
                        uiapi {
                            query {
                                Account(where: { Name: { like: "Account1" } }) @connection {
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

                const expectedQuery = /* GraphQL */ `
                    query {
                        __typename
                        uiapi {
                            __typename
                            query {
                                __typename
                                Account(where: { Name: { like: "Account1" } }) {
                                    __typename
                                    edges {
                                        __typename
                                        node {
                                            Name {
                                                __typename
                                                value
                                                displayValue
                                            }
                                            ...defaultRecordFields
                                        }
                                        cursor
                                    }
                                    pageInfo {
                                        hasNextPage
                                        hasPreviousPage
                                    }
                                    totalCount
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

                const snapshot = await graphQLImperative(graphqlConfig);
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
                const query = parseQuery(/* GraphQL */ `
                    query {
                        uiapi {
                            query {
                                Opportunity(where: { Name: { eq: "Opp1" } }) @connection {
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

                const expectedQuery = /* GraphQL */ `
                    query {
                        __typename
                        uiapi {
                            __typename
                            query {
                                __typename
                                Opportunity(where: { Name: { eq: "Opp1" } }) {
                                    __typename
                                    edges {
                                        __typename
                                        node {
                                            Name {
                                                __typename
                                                value
                                                displayValue
                                            }
                                            ...defaultRecordFields
                                        }
                                        cursor
                                    }
                                    pageInfo {
                                        hasNextPage
                                        hasPreviousPage
                                    }
                                    totalCount
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
                        optionalFields: ['Opportunity.Name'],
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

                const snapshot = await graphQLImperative({
                    query,
                    variables: {},
                });
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

            // TODO [W-9987637]: test relies on cache policy handling pending snapshot correctly
            xit('should refresh data when gql returns old records', async () => {
                const query = parseQuery(/* GraphQL */ `
                    query {
                        uiapi {
                            query {
                                Opportunity(where: { Name: { eq: "Opp1" } }) @connection {
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

                const expectedQuery = /* GraphQL */ `
                    query {
                        __typename
                        uiapi {
                            __typename
                            query {
                                __typename
                                Opportunity(where: { Name: { eq: "Opp1" } }) {
                                    __typename
                                    edges {
                                        __typename
                                        node {
                                            Name {
                                                __typename
                                                value
                                                displayValue
                                            }
                                            ...defaultRecordFields
                                        }
                                        cursor
                                    }
                                    pageInfo {
                                        hasNextPage
                                        hasPreviousPage
                                    }
                                    totalCount
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

                // Lowest WeakEtag
                const networkData = getMock('RecordQuery-Opportunity-fields-Name');

                // Higher WeakEtag
                const recordRepMock = getMock(
                    'RecordRepresentation-Opportunity-fields-Opportunity.Id'
                );

                // Same WeakEtag as recordRepMock (Higher)
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

                // Load Higher WeakEtag
                await setupElement(
                    {
                        recordId: recordRepMock.id,
                        fields: ['Opportunity.Id'],
                    },
                    GetRecord
                );

                // Load Lower WeakEtag
                // Will trigger refresh that loads recordRepUpdated
                const snapshot = await graphQLImperative({
                    query,
                    variables: {},
                });

                expect(snapshot.data).toEqual({
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
            const ast = parseQuery(/* GraphQL */ `
                {
                    uiapi {
                        query {
                            Account(where: { Name: { eq: "Account1" } }) @connection {
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

            const mock = getMockQueryData('GraphQL-Account-fields-null-Parent');
            mockGraphqlNetwork(QueryAccountFieldsNullParent, mock);

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);
        });
    });

    describe('Errors', () => {
        it('should emit error responses to the user', async () => {
            const invalidQuery = parseQuery(/* GraphQL */ `
                {
                    uiapi {
                        query {
                            asd
                        }
                    }
                }
            `);

            const mock = getMockQueryData('GraphQL-Error-Invalid-Field');
            mockGraphqlNetwork(QueryErrorInvalidField, mock);

            const graphqlConfig = {
                query: invalidQuery,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(mock);
        });

        it('displays error when network request returns 404s', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
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

            const networkError = {
                ok: false,
                status: 404,
                statusText: 'NOT_FOUND',
                body: [
                    {
                        errorCode: 'NOT_FOUND',
                        message: 'The requested resource does not exist',
                    },
                ],
            };
            mockGraphqlNetworkErrorOnce(QueryAccountFieldsName, networkError);

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.error).toEqual(networkError);
        });
    });

    describe('Child Relationships', () => {
        it('should load child relationship correctly', async () => {
            const ast = parseQuery(/* GraphQL */ `
                {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name {
                                            value
                                            displayValue
                                        }
                                        Opportunities @connection {
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
                        }
                    }
                }
            `);

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
                                            Opportunities: {
                                                edges: [
                                                    {
                                                        node: {
                                                            Name: {
                                                                value: 'Opp1',
                                                            },
                                                        },
                                                    },
                                                    {
                                                        node: {
                                                            Name: {
                                                                value: 'Opp2',
                                                            },
                                                        },
                                                    },
                                                ],
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

            const mock = getMockQueryData('GraphQL-Account-childRelationships-Opportunities');
            mockGraphqlNetwork(QueryAccountChildRelationshipsOpportunity, mock);

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);
        });
    });

    describe('variables', () => {
        it('hits network when no data is in the cache', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query ($accountNames: [String]) {
                    uiapi {
                        query {
                            Account(where: { Name: { in: $accountNames } }) @connection {
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

            const networkData = getMockQueryData('GraphQL-Account-fields-Name-variables-Account1');
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

            mockGraphqlNetwork(QueryAccountFieldsNameVariablesAccount1, networkData);

            const graphqlConfig = {
                query: ast,
                variables: {
                    accountNames: ['Account1', 'foo'],
                },
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);
        });

        it('should not hit network when all data is in cache', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
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

            const networkData = getMockQueryData('GraphQL-Account-fields-Name');
            mockGraphqlNetwork(QueryAccountFieldsName, networkData);

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);

            const secondAst = parseQuery(/* GraphQL */ `
                query ($accountName: String) {
                    uiapi {
                        query {
                            Account(where: { Name: { like: $accountName } }) @connection {
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

            const secondGraphqlConfig = {
                query: secondAst,
                variables: {
                    accountName: 'Account1',
                },
            };
            const secondSnapshot = graphQLImperative(secondGraphqlConfig);
            expect(secondSnapshot.data).toEqualSnapshotWithoutEtags(expectedData);
        });
    });

    describe('Unchanged network data', () => {
        it('should not update subscriptions when overlapping network data has not changed', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
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

            const ast2 = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Phone {
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

            const networkData = getMockQueryData('GraphQL-Account-fields-Name');
            mockGraphqlNetwork(QueryAccountFieldsName, networkData);

            const networkDataTwo = getMockQueryData('GraphQL-Account-fields-Phone');
            mockGraphqlNetwork(QueryAccountFieldsPhone, networkDataTwo);

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const secondGraphQLConfig = {
                query: ast2,
                variables: {},
            };

            // initial load
            const snapshot = await graphQLImperative(graphqlConfig);
            const spy = sinon.spy();
            luvio.storeSubscribe(snapshot, spy);

            // loads a superset of data, data relevant to first snapshot
            // is not changed
            await graphQLImperative(secondGraphQLConfig);

            // assert that first subscription was not given a new value
            expect(spy.callCount).toBe(0);
        });
    });
});
