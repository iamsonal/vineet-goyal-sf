import { astToString, serializeOperationDefinition } from '../ast-to-string';
import { serializeCustomFieldRecord, serializeArguments } from '../serialize';
import {
    parseAndVisit,
    LuvioArgumentNode,
    LuvioDocumentNode,
    LuvioOperationDefinitionNode,
    LuvioSelectionCustomFieldNode,
} from '@luvio/graphql-parser';

describe('AST to string', () => {
    it('should create correct graphql query', () => {
        const ast: LuvioDocumentNode = {
            kind: 'Document',
            definitions: [
                {
                    kind: 'OperationDefinition',
                    operation: 'query',
                    variableDefinitions: [],
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

        const expectedQuery = `query { __typename uiapi { __typename query { __typename Account(where: { Name: { like: "Account1" } }) { __typename edges { __typename node { Name { __typename value, displayValue,  } ...defaultRecordFields } cursor } pageInfo { hasNextPage, hasPreviousPage } totalCount } } } } fragment defaultRecordFields on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }`;

        const actual = astToString(ast);
        expect(actual).toEqual(expectedQuery);
    });

    describe('serializeArguments', () => {
        it('should serialize deep arguments correctly', () => {
            const args: LuvioArgumentNode[] = [
                {
                    kind: 'Argument',
                    name: 'orderBy',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            AppointmentNumber: {
                                kind: 'ObjectValue',
                                fields: {
                                    order: {
                                        kind: 'EnumValue',
                                        value: 'ASC',
                                    },
                                    nulls: {
                                        kind: 'EnumValue',
                                        value: 'FIRST',
                                    },
                                },
                            },
                            Id: {
                                kind: 'ObjectValue',
                                fields: {
                                    order: {
                                        kind: 'EnumValue',
                                        value: 'ASC',
                                    },
                                    nulls: {
                                        kind: 'EnumValue',
                                        value: 'FIRST',
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    kind: 'Argument',
                    name: 'first',
                    value: {
                        kind: 'IntValue',
                        value: '1000',
                    },
                },
                {
                    kind: 'Argument',
                    name: 'where',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            SchedStartTime: {
                                kind: 'ObjectValue',
                                fields: {
                                    gte: {
                                        kind: 'ObjectValue',
                                        fields: {
                                            range: {
                                                kind: 'ObjectValue',
                                                fields: {
                                                    last_n_months: {
                                                        kind: 'IntValue',
                                                        value: '4',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            and: {
                                kind: 'ObjectValue',
                                fields: {
                                    SchedEndTime: {
                                        kind: 'ObjectValue',
                                        fields: {
                                            lte: {
                                                kind: 'ObjectValue',
                                                fields: {
                                                    range: {
                                                        kind: 'ObjectValue',
                                                        fields: {
                                                            next_n_months: {
                                                                kind: 'IntValue',
                                                                value: '4',
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ];

            const expectedQuery =
                'orderBy: { AppointmentNumber: { order: ASC, nulls: FIRST }, Id: { order: ASC, nulls: FIRST } } first: 1000 where: { SchedStartTime: { gte: { range: { last_n_months: 4 } } }, and: { SchedEndTime: { lte: { range: { next_n_months: 4 } } } } }';

            const actual = serializeArguments(args);
            expect(actual).toEqual(expectedQuery);
        });
    });

    describe('serializeOperationDefinition', () => {
        it('should serialize named operation correctly', () => {
            const operationNode: LuvioOperationDefinitionNode = {
                kind: 'OperationDefinition',
                operation: 'query',
                variableDefinitions: [],
                name: 'operationName',
                luvioSelections: [],
            };

            const result = serializeOperationDefinition(operationNode, { fragments: {} });
            expect(result).toEqual('query operationName { __typename  }');
        });
    });

    it('should make correct request when arguments are present outside @connection directive', () => {
        const ast: LuvioDocumentNode = {
            kind: 'Document',
            definitions: [
                {
                    kind: 'OperationDefinition',
                    operation: 'query',
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

        const expectedQuery = `query { __typename uiapi { __typename query { __typename Account(where: { Name: { like: "Account1" } }) { __typename edges { __typename node { __typename id, WeakEtag, Name { __typename value, displayValue,  } } } } } } }`;

        const actual = astToString(ast);
        expect(actual).toEqual(expectedQuery);
    });

    it('should create correct query when @connection directive does not contain arguments', () => {
        const query = `
            {
                uiapi {
                    query {
                        Opportunity {
                            edges {
                                Partners @connection {
                                    edges {
                                        node {
                                            Id
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        const parsed = parseAndVisit(query);
        const string = astToString(parsed);
        expect(string).toEqual(
            'query { __typename uiapi { __typename query { __typename Opportunity { __typename edges { __typename Partners { __typename edges { __typename node { __typename Id,  } cursor } pageInfo { hasNextPage, hasPreviousPage } totalCount } } } } } }'
        );
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

            const expectedQuery = `node { Name { __typename value, displayValue,  } ...defaultRecordFields }`;
            const expectedState = {
                fragments: {
                    defaultRecordFields:
                        'fragment defaultRecordFields on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }',
                },
            };

            expect(actual).toEqual(expectedQuery);
            expect(state).toEqual(expectedState);
        });

        it('throws when serializing unsupported object field', () => {
            const recordSelection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    { kind: 'ScalarFieldSelection', name: 'Id' },
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'ContentDocument',
                        luvioSelections: [{ kind: 'ScalarFieldSelection', name: 'Id' }],
                    },
                ],
            };

            const state = { fragments: {} };

            expect(() => serializeCustomFieldRecord(recordSelection, state)).toThrowError(
                'Invalid selection for "ContentDocument.Id". Only value, displayValue are supported. If "ContentDocument" is a spanning Record, please include @resource(type: "Record") directive.'
            );
        });

        it('throws when serializing unsupported nested object field', () => {
            const recordSelection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'Id',
                    },
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'ContentDocumentId',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'value',
                            },
                        ],
                    },
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'ContentDocument',
                        luvioSelections: [
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'Title',
                                luvioSelections: [
                                    {
                                        kind: 'ScalarFieldSelection',
                                        name: 'value',
                                    },
                                ],
                            },
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'FileType',
                                luvioSelections: [
                                    {
                                        kind: 'ScalarFieldSelection',
                                        name: 'value',
                                    },
                                ],
                            },
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'FileExtension',
                                luvioSelections: [
                                    {
                                        kind: 'ScalarFieldSelection',
                                        name: 'value',
                                    },
                                ],
                            },
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'ContentSize',
                                luvioSelections: [
                                    {
                                        kind: 'ScalarFieldSelection',
                                        name: 'value',
                                    },
                                ],
                            },
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'LastModifiedDate',
                                luvioSelections: [
                                    {
                                        kind: 'ScalarFieldSelection',
                                        name: 'value',
                                    },
                                ],
                            },
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'LatestPublishedVersion',
                                luvioSelections: [
                                    {
                                        kind: 'ObjectFieldSelection',
                                        name: 'VersionNumber',
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
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'LinkedEntityId',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'value',
                            },
                        ],
                    },
                ],
            };

            const state = { fragments: {} };

            expect(() => serializeCustomFieldRecord(recordSelection, state)).toThrowError(
                'Invalid selection for ContentDocument. ContentDocument appears to be a Record, but is missing @resource(type: "Record")'
            );
        });

        it('throws when serializing unsupported scalar field', () => {
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
                                name: 'label',
                            },
                        ],
                    },
                ],
            };

            const state = { fragments: {} };

            expect(() => serializeCustomFieldRecord(recordSelection, state)).toThrowError(
                'Invalid selection for "Name.label". Only value, displayValue are supported. If "Name" is a spanning Record, please include @resource(type: "Record") directive.'
            );
        });
    });

    it('should create correct graphql query when using aliases', () => {
        const ast: LuvioDocumentNode = {
            kind: 'Document',
            definitions: [
                {
                    kind: 'OperationDefinition',
                    operation: 'query',
                    variableDefinitions: [],
                    luvioSelections: [
                        {
                            kind: 'ObjectFieldSelection',
                            name: 'uiapi',
                            alias: 'MyApi',
                            luvioSelections: [
                                {
                                    kind: 'ObjectFieldSelection',
                                    name: 'query',
                                    luvioSelections: [
                                        {
                                            kind: 'CustomFieldSelection',
                                            name: 'Account',
                                            type: 'Connection',
                                            alias: 'MyAccount',
                                            luvioSelections: [
                                                {
                                                    kind: 'ObjectFieldSelection',
                                                    name: 'edges',
                                                    luvioSelections: [
                                                        {
                                                            kind: 'CustomFieldSelection',
                                                            name: 'node',
                                                            type: 'Record',
                                                            alias: 'MyNode',
                                                            luvioSelections: [
                                                                {
                                                                    kind: 'ObjectFieldSelection',
                                                                    name: 'Name',
                                                                    alias: 'MyName',
                                                                    luvioSelections: [
                                                                        {
                                                                            kind: 'ScalarFieldSelection',
                                                                            name: 'value',
                                                                            alias: 'MyValue',
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

        const expectedQuery = `query { __typename MyApi: uiapi { __typename query { __typename MyAccount: Account(where: { Name: { like: "Account1" } }) { __typename edges { __typename MyNode: node { MyName: Name { __typename MyValue: value, displayValue,  } ...defaultRecordFields } cursor } pageInfo { hasNextPage, hasPreviousPage } totalCount } } } } fragment defaultRecordFields on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }`;

        const actual = astToString(ast);
        expect(actual).toEqual(expectedQuery);
    });

    it('should create correct graphql query when using variables', () => {
        const ast: LuvioDocumentNode = {
            kind: 'Document',
            definitions: [
                {
                    kind: 'OperationDefinition',
                    operation: 'query',
                    luvioSelections: [
                        {
                            kind: 'ObjectFieldSelection',
                            name: 'uiapi',
                            alias: 'MyApi',
                            luvioSelections: [
                                {
                                    kind: 'ObjectFieldSelection',
                                    name: 'query',
                                    luvioSelections: [
                                        {
                                            kind: 'CustomFieldSelection',
                                            name: 'Account',
                                            type: 'Connection',
                                            alias: 'MyAccount',
                                            luvioSelections: [
                                                {
                                                    kind: 'ObjectFieldSelection',
                                                    name: 'edges',
                                                    luvioSelections: [
                                                        {
                                                            kind: 'CustomFieldSelection',
                                                            name: 'node',
                                                            type: 'Record',
                                                            alias: 'MyNode',
                                                            luvioSelections: [
                                                                {
                                                                    kind: 'ObjectFieldSelection',
                                                                    name: 'Name',
                                                                    alias: 'MyName',
                                                                    luvioSelections: [
                                                                        {
                                                                            kind: 'ScalarFieldSelection',
                                                                            name: 'value',
                                                                            alias: 'MyValue',
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
                                                                        kind: 'Variable',
                                                                        name: 'accountName',
                                                                    },
                                                                },
                                                            },
                                                            Id: {
                                                                kind: 'ObjectValue',
                                                                fields: {
                                                                    in: {
                                                                        kind: 'Variable',
                                                                        name: 'Id',
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
                    variableDefinitions: [
                        {
                            kind: 'VariableDefinition',
                            variable: {
                                kind: 'Variable',
                                name: 'accountName',
                            },
                            type: {
                                kind: 'NamedType',
                                name: 'String',
                            },
                            defaultValue: {
                                kind: 'StringValue',
                                value: 'Account2',
                            },
                        },
                        {
                            kind: 'VariableDefinition',
                            variable: {
                                kind: 'Variable',
                                name: 'Id',
                            },
                            type: {
                                kind: 'ListType',
                                type: {
                                    kind: 'NamedType',
                                    name: 'ID',
                                },
                            },
                            defaultValue: {
                                kind: 'ListValue',
                                values: [
                                    {
                                        kind: 'StringValue',
                                        value: '001RM000004uuhtYAA',
                                    },
                                    {
                                        kind: 'StringValue',
                                        value: '001RM000004uuhsYAA',
                                    },
                                ],
                            },
                        },
                    ],
                },
            ],
        };

        const expectedQuery = `query  ($accountName: String = "Account2", $Id: [ID] = ["001RM000004uuhtYAA", "001RM000004uuhsYAA"]){ __typename MyApi: uiapi { __typename query { __typename MyAccount: Account(where: { Name: { like: $accountName }, Id: { in: $Id } }) { __typename edges { __typename MyNode: node { MyName: Name { __typename MyValue: value, displayValue,  } ...defaultRecordFields } cursor } pageInfo { hasNextPage, hasPreviousPage } totalCount } } } } fragment defaultRecordFields on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }`;

        const actual = astToString(ast);
        expect(actual).toEqual(expectedQuery);
    });

    describe('Record, default field values', () => {
        it('should add default field values to spanning fields on a Record', () => {
            const ast: LuvioDocumentNode = {
                kind: 'Document',
                definitions: [
                    {
                        kind: 'OperationDefinition',
                        operation: 'query',
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

            const expectedQuery = `query { __typename uiapi { __typename query { __typename Account(where: { Name: { like: "Account1" } }) { __typename edges { __typename node { Name { __typename value, displayValue,  } ...defaultRecordFields } cursor } pageInfo { hasNextPage, hasPreviousPage } totalCount } } } } fragment defaultRecordFields on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }`;
            const actual = astToString(ast);

            expect(actual).toEqual(expectedQuery);
        });

        it('should not add duplicate default field values to spanning fields on a Record', () => {
            const ast: LuvioDocumentNode = {
                kind: 'Document',
                definitions: [
                    {
                        kind: 'OperationDefinition',
                        operation: 'query',
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
                                                                    {
                                                                        kind: 'ObjectFieldSelection',
                                                                        name: 'Phone',
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

            const expectedQuery = `query { __typename uiapi { __typename query { __typename Account(where: { Name: { like: "Account1" } }) { __typename edges { __typename node { Name { __typename value, displayValue,  }Phone { __typename value, displayValue,  } ...defaultRecordFields } cursor } pageInfo { hasNextPage, hasPreviousPage } totalCount } } } } fragment defaultRecordFields on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }`;
            const actual = astToString(ast);

            expect(actual).toEqual(expectedQuery);
        });
    });
});
