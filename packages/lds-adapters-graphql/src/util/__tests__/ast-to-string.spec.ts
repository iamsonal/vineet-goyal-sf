import { astToString, serializeCustomFieldRecord } from '../ast-to-string';
import { LuvioDocumentNode, LuvioSelectionCustomFieldNode } from '@salesforce/lds-graphql-parser';

describe('AST to string', () => {
    it('should create correct graphql query', () => {
        const ast: LuvioDocumentNode = {
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

        const expectedQuery = `query { uiapi { query { Account(where:  { Name:  { like: "Account1" } }) { edges { node { Name { value, displayValue,  } ...defaultRecordFields } } } } } } fragment defaultRecordFields on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }`;

        const actual = astToString(ast);
        expect(actual).toEqual(expectedQuery);
    });

    it('should make correct request when arguments are present outside @connection directive', () => {
        const ast: LuvioDocumentNode = {
            kind: 'Document',
            definitions: [
                {
                    kind: 'OperationDefinition',
                    operation: 'query',
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
                                            kind: 'ObjectFieldSelection',
                                            name: 'Account',
                                            luvioSelections: [
                                                {
                                                    kind: 'ObjectFieldSelection',
                                                    name: 'edges',
                                                    luvioSelections: [
                                                        {
                                                            kind: 'ObjectFieldSelection',
                                                            name: 'node',
                                                            luvioSelections: [
                                                                {
                                                                    kind: 'ScalarFieldSelection',
                                                                    name: 'id',
                                                                },
                                                                {
                                                                    kind: 'ScalarFieldSelection',
                                                                    name: 'WeakEtag',
                                                                },
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

        const expectedQuery = `query { uiapi { query { Account(where:  { Name:  { like: "Account1" } }) { edges { node { id, WeakEtag, Name { value, displayValue,  } } } } } } }`;

        const actual = astToString(ast);
        expect(actual).toEqual(expectedQuery);
    });

    describe('custom field selection - record', () => {
        it('serialize record with scalar type field', () => {
            const recordSelection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'Id',
                    },
                ],
            };

            const state = {
                fragments: {},
            };
            const actual = serializeCustomFieldRecord(recordSelection, state);

            const expectedQuery = `node { Id,  ...defaultRecordFields }`;
            const expectedState = {
                fragments: {
                    defaultRecordFields:
                        'fragment defaultRecordFields on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }',
                },
            };

            expect(actual).toEqual(expectedQuery);
            expect(state).toEqual(expectedState);
        });

        it('serialize record with field value', () => {
            const recordSelection: LuvioSelectionCustomFieldNode = {
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
            };

            const state = {
                fragments: {},
            };
            const actual = serializeCustomFieldRecord(recordSelection, state);

            const expectedQuery = `node { Name { value, displayValue,  } ...defaultRecordFields }`;
            const expectedState = {
                fragments: {
                    defaultRecordFields:
                        'fragment defaultRecordFields on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }',
                },
            };

            expect(actual).toEqual(expectedQuery);
            expect(state).toEqual(expectedState);
        });
    });
});
