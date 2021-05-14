import { getMock as globalGetMock } from 'test-util';
import { mockGraphqlNetwork } from 'graphql-test-util';

import { graphQLImperative } from 'lds-adapters-graphql';

const MOCK_PREFIX = 'wire/graphql/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('graphql', () => {
    describe('no cache', () => {
        it('hits network when no data is in the cache', async () => {
            const ast = {
                kind: 'Document',
                definitions: [
                    {
                        kind: 'OperationDefinition',
                        operation: 'query',
                        variableDefinitions: [],
                        name: 'operationName',
                        luvioSelections: [
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'uiapi',
                                luvioSelections: [
                                    {
                                        kind: 'ObjectFieldSelection',
                                        name: 'query',
                                        luvioSelections: [
                                            {
                                                kind: 'CustomFieldSelection',
                                                name: 'Account',
                                                type: 'Connection',
                                                luvioSelections: [
                                                    {
                                                        kind: 'ObjectFieldSelection',
                                                        name: 'edges',
                                                        luvioSelections: [
                                                            {
                                                                kind: 'CustomFieldSelection',
                                                                name: 'node',
                                                                type: 'Record',
                                                                luvioSelections: [
                                                                    {
                                                                        kind: 'ObjectFieldSelection',
                                                                        name: 'Name',
                                                                        luvioSelections: [
                                                                            {
                                                                                kind: 'ScalarFieldSelection',
                                                                                name: 'value',
                                                                            },
                                                                            {
                                                                                kind: 'ScalarFieldSelection',
                                                                                name: 'displayValue',
                                                                            },
                                                                        ],
                                                                    },
                                                                ],
                                                            },
                                                        ],
                                                    },
                                                ],
                                                arguments: [
                                                    {
                                                        kind: 'Argument',
                                                        name: 'where',
                                                        value: {
                                                            kind: 'ObjectValue',
                                                            fields: {
                                                                Name: {
                                                                    kind: 'ObjectValue',
                                                                    fields: {
                                                                        like: {
                                                                            kind: 'StringValue',
                                                                            value: 'Account1',
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const expectedQuery = `query { uiapi { query { Account(where:  { Name:  { like: "Account1" } }) { edges { node { Id, WeakEtag, Name { value, displayValue,  } ...defaultRecordFields } } } } } } fragment defaultRecordFields on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }`;

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
            const ast = {
                kind: 'Document',
                definitions: [
                    {
                        kind: 'OperationDefinition',
                        operation: 'query',
                        variableDefinitions: [],
                        name: 'operationName',
                        luvioSelections: [
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'uiapi',
                                luvioSelections: [
                                    {
                                        kind: 'ObjectFieldSelection',
                                        name: 'query',
                                        luvioSelections: [
                                            {
                                                kind: 'CustomFieldSelection',
                                                name: 'Account',
                                                type: 'Connection',
                                                luvioSelections: [
                                                    {
                                                        kind: 'ObjectFieldSelection',
                                                        name: 'edges',
                                                        luvioSelections: [
                                                            {
                                                                kind: 'CustomFieldSelection',
                                                                name: 'node',
                                                                type: 'Record',
                                                                luvioSelections: [
                                                                    {
                                                                        kind: 'ObjectFieldSelection',
                                                                        name: 'Name',
                                                                        luvioSelections: [
                                                                            {
                                                                                kind: 'ScalarFieldSelection',
                                                                                name: 'value',
                                                                            },
                                                                            {
                                                                                kind: 'ScalarFieldSelection',
                                                                                name: 'displayValue',
                                                                            },
                                                                        ],
                                                                    },
                                                                ],
                                                            },
                                                        ],
                                                    },
                                                ],
                                                arguments: [
                                                    {
                                                        kind: 'Argument',
                                                        name: 'where',
                                                        value: {
                                                            kind: 'ObjectValue',
                                                            fields: {
                                                                Name: {
                                                                    kind: 'ObjectValue',
                                                                    fields: {
                                                                        like: {
                                                                            kind: 'StringValue',
                                                                            value: 'Account1',
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const expectedQuery = `query { uiapi { query { Account(where:  { Name:  { like: "Account1" } }) { edges { node { Id, WeakEtag, Name { value, displayValue,  } ...defaultRecordFields } } } } } } fragment defaultRecordFields on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }`;

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
            const ast = {
                kind: 'Document',
                definitions: [
                    {
                        kind: 'OperationDefinition',
                        operation: 'query',
                        variableDefinitions: [],
                        name: 'operationName',
                        luvioSelections: [
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'uiapi',
                                luvioSelections: [
                                    {
                                        kind: 'ObjectFieldSelection',
                                        name: 'query',
                                        luvioSelections: [
                                            {
                                                kind: 'CustomFieldSelection',
                                                name: 'Account',
                                                type: 'Connection',
                                                luvioSelections: [
                                                    {
                                                        kind: 'ObjectFieldSelection',
                                                        name: 'edges',
                                                        luvioSelections: [
                                                            {
                                                                kind: 'CustomFieldSelection',
                                                                name: 'node',
                                                                type: 'Record',
                                                                luvioSelections: [
                                                                    {
                                                                        kind: 'ObjectFieldSelection',
                                                                        name: 'Name',
                                                                        luvioSelections: [
                                                                            {
                                                                                kind: 'ScalarFieldSelection',
                                                                                name: 'value',
                                                                            },
                                                                            {
                                                                                kind: 'ScalarFieldSelection',
                                                                                name: 'displayValue',
                                                                            },
                                                                        ],
                                                                    },
                                                                ],
                                                            },
                                                        ],
                                                    },
                                                ],
                                                arguments: [
                                                    {
                                                        kind: 'Argument',
                                                        name: 'where',
                                                        value: {
                                                            kind: 'ObjectValue',
                                                            fields: {
                                                                Name: {
                                                                    kind: 'ObjectValue',
                                                                    fields: {
                                                                        like: {
                                                                            kind: 'StringValue',
                                                                            value: 'Account1',
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const expectedQuery = `query { uiapi { query { Account(where:  { Name:  { like: "Account1" } }) { edges { node { Id, WeakEtag, Name { value, displayValue,  } ...defaultRecordFields } } } } } } fragment defaultRecordFields on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }`;

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
            const cachedDataAst = {
                kind: 'Document',
                definitions: [
                    {
                        kind: 'OperationDefinition',
                        operation: 'query',
                        variableDefinitions: [],
                        name: 'operationName',
                        luvioSelections: [
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'uiapi',
                                luvioSelections: [
                                    {
                                        kind: 'ObjectFieldSelection',
                                        name: 'query',
                                        luvioSelections: [
                                            {
                                                kind: 'CustomFieldSelection',
                                                name: 'Account',
                                                type: 'Connection',
                                                luvioSelections: [
                                                    {
                                                        kind: 'ObjectFieldSelection',
                                                        name: 'edges',
                                                        luvioSelections: [
                                                            {
                                                                kind: 'CustomFieldSelection',
                                                                name: 'node',
                                                                type: 'Record',
                                                                luvioSelections: [
                                                                    {
                                                                        kind: 'ObjectFieldSelection',
                                                                        name: 'Name',
                                                                        luvioSelections: [
                                                                            {
                                                                                kind: 'ScalarFieldSelection',
                                                                                name: 'value',
                                                                            },
                                                                        ],
                                                                    },
                                                                ],
                                                            },
                                                        ],
                                                    },
                                                ],
                                                arguments: [
                                                    {
                                                        kind: 'Argument',
                                                        name: 'where',
                                                        value: {
                                                            kind: 'ObjectValue',
                                                            fields: {
                                                                Name: {
                                                                    kind: 'ObjectValue',
                                                                    fields: {
                                                                        like: {
                                                                            kind: 'StringValue',
                                                                            value: 'Account1',
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const secondSnapshot = await graphQLImperative({
                query: cachedDataAst,
                variables: {},
            });
            expect(secondSnapshot.data).toEqual(expectedData);
        });
    });
});
