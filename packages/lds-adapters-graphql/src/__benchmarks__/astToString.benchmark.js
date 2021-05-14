import { astToString } from 'lds-adapters-graphql/src/util/ast-to-string.js';

describe('convert AST to query string', () => {
    benchmark('1 nested ObjectFieldSelection with 1 query', () => {
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

        run(() => {
            astToString(ast);
        });
    });

    benchmark('2 nested ObjectFieldSelection with 1 query', () => {
        const ast = {
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
                                    kind: 'ScalarFieldSelection',
                                    name: 'query',
                                },
                                {
                                    kind: 'ObjectFieldSelection',
                                    name: 'xyz',
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
                                                                    name: 'Id',
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
                                                                {
                                                                    kind: 'ObjectFieldSelection',
                                                                    name: 'Owner',
                                                                    luvioSelections: [
                                                                        {
                                                                            kind: 'ObjectFieldSelection',
                                                                            name: 'edges',
                                                                            luvioSelections: [
                                                                                {
                                                                                    kind: 'ObjectFieldSelection',
                                                                                    name: 'node',
                                                                                    luvioSelections:
                                                                                        [
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'Id',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'WeakEtag',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ObjectFieldSelection',
                                                                                                name: 'Name',
                                                                                                luvioSelections:
                                                                                                    [
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

        run(() => {
            astToString(ast);
        });
    });

    benchmark('1 nested ObjectFieldSelection with 10 queries', () => {
        const ast = {
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
                                                                    name: 'Id',
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
                                                                    name: 'Id',
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
                                                                        value: 'Account2',
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
                                                                    name: 'Id',
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
                                                                        value: 'Account3',
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
                                                                    name: 'Id',
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
                                                                        value: 'Account4',
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
                                                                    name: 'Id',
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
                                                                        value: 'Account5',
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
                                                                    name: 'Id',
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
                                                                        value: 'Account6',
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
                                                                    name: 'Id',
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
                                                                        value: 'Account7',
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
                                                                    name: 'Id',
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
                                                                        value: 'Account8',
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
                                                                    name: 'Id',
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
                                                                        value: 'Account9',
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
                                                                    name: 'Id',
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
                                                                        value: 'Account10',
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

        run(() => {
            astToString(ast);
        });
    });

    benchmark('2 nested ObjectFieldSelection with 10 queries', () => {
        const ast = {
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
                                                                    name: 'Id',
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
                                                                {
                                                                    kind: 'ObjectFieldSelection',
                                                                    name: 'Owner',
                                                                    luvioSelections: [
                                                                        {
                                                                            kind: 'ObjectFieldSelection',
                                                                            name: 'edges',
                                                                            luvioSelections: [
                                                                                {
                                                                                    kind: 'ObjectFieldSelection',
                                                                                    name: 'node',
                                                                                    luvioSelections:
                                                                                        [
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'Id',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'WeakEtag',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ObjectFieldSelection',
                                                                                                name: 'Name',
                                                                                                luvioSelections:
                                                                                                    [
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
                                                                    name: 'Id',
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
                                                                {
                                                                    kind: 'ObjectFieldSelection',
                                                                    name: 'Owner',
                                                                    luvioSelections: [
                                                                        {
                                                                            kind: 'ObjectFieldSelection',
                                                                            name: 'edges',
                                                                            luvioSelections: [
                                                                                {
                                                                                    kind: 'ObjectFieldSelection',
                                                                                    name: 'node',
                                                                                    luvioSelections:
                                                                                        [
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'Id',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'WeakEtag',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ObjectFieldSelection',
                                                                                                name: 'Name',
                                                                                                luvioSelections:
                                                                                                    [
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
                                                                        value: 'Account2',
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
                                                                    name: 'Id',
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
                                                                {
                                                                    kind: 'ObjectFieldSelection',
                                                                    name: 'Owner',
                                                                    luvioSelections: [
                                                                        {
                                                                            kind: 'ObjectFieldSelection',
                                                                            name: 'edges',
                                                                            luvioSelections: [
                                                                                {
                                                                                    kind: 'ObjectFieldSelection',
                                                                                    name: 'node',
                                                                                    luvioSelections:
                                                                                        [
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'Id',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'WeakEtag',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ObjectFieldSelection',
                                                                                                name: 'Name',
                                                                                                luvioSelections:
                                                                                                    [
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
                                                                        value: 'Account3',
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
                                                                    name: 'Id',
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
                                                                {
                                                                    kind: 'ObjectFieldSelection',
                                                                    name: 'Owner',
                                                                    luvioSelections: [
                                                                        {
                                                                            kind: 'ObjectFieldSelection',
                                                                            name: 'edges',
                                                                            luvioSelections: [
                                                                                {
                                                                                    kind: 'ObjectFieldSelection',
                                                                                    name: 'node',
                                                                                    luvioSelections:
                                                                                        [
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'Id',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'WeakEtag',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ObjectFieldSelection',
                                                                                                name: 'Name',
                                                                                                luvioSelections:
                                                                                                    [
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
                                                                        value: 'Account4',
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
                                                                    name: 'Id',
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
                                                                {
                                                                    kind: 'ObjectFieldSelection',
                                                                    name: 'Owner',
                                                                    luvioSelections: [
                                                                        {
                                                                            kind: 'ObjectFieldSelection',
                                                                            name: 'edges',
                                                                            luvioSelections: [
                                                                                {
                                                                                    kind: 'ObjectFieldSelection',
                                                                                    name: 'node',
                                                                                    luvioSelections:
                                                                                        [
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'Id',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'WeakEtag',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ObjectFieldSelection',
                                                                                                name: 'Name',
                                                                                                luvioSelections:
                                                                                                    [
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
                                                                        value: 'Account5',
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
                                                                    name: 'Id',
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
                                                                {
                                                                    kind: 'ObjectFieldSelection',
                                                                    name: 'Owner',
                                                                    luvioSelections: [
                                                                        {
                                                                            kind: 'ObjectFieldSelection',
                                                                            name: 'edges',
                                                                            luvioSelections: [
                                                                                {
                                                                                    kind: 'ObjectFieldSelection',
                                                                                    name: 'node',
                                                                                    luvioSelections:
                                                                                        [
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'Id',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'WeakEtag',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ObjectFieldSelection',
                                                                                                name: 'Name',
                                                                                                luvioSelections:
                                                                                                    [
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
                                                                        value: 'Account6',
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
                                                                    name: 'Id',
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
                                                                {
                                                                    kind: 'ObjectFieldSelection',
                                                                    name: 'Owner',
                                                                    luvioSelections: [
                                                                        {
                                                                            kind: 'ObjectFieldSelection',
                                                                            name: 'edges',
                                                                            luvioSelections: [
                                                                                {
                                                                                    kind: 'ObjectFieldSelection',
                                                                                    name: 'node',
                                                                                    luvioSelections:
                                                                                        [
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'Id',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'WeakEtag',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ObjectFieldSelection',
                                                                                                name: 'Name',
                                                                                                luvioSelections:
                                                                                                    [
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
                                                                        value: 'Account7',
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
                                                                    name: 'Id',
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
                                                                {
                                                                    kind: 'ObjectFieldSelection',
                                                                    name: 'Owner',
                                                                    luvioSelections: [
                                                                        {
                                                                            kind: 'ObjectFieldSelection',
                                                                            name: 'edges',
                                                                            luvioSelections: [
                                                                                {
                                                                                    kind: 'ObjectFieldSelection',
                                                                                    name: 'node',
                                                                                    luvioSelections:
                                                                                        [
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'Id',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'WeakEtag',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ObjectFieldSelection',
                                                                                                name: 'Name',
                                                                                                luvioSelections:
                                                                                                    [
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
                                                                        value: 'Account8',
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
                                                                    name: 'Id',
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
                                                                {
                                                                    kind: 'ObjectFieldSelection',
                                                                    name: 'Owner',
                                                                    luvioSelections: [
                                                                        {
                                                                            kind: 'ObjectFieldSelection',
                                                                            name: 'edges',
                                                                            luvioSelections: [
                                                                                {
                                                                                    kind: 'ObjectFieldSelection',
                                                                                    name: 'node',
                                                                                    luvioSelections:
                                                                                        [
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'Id',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'WeakEtag',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ObjectFieldSelection',
                                                                                                name: 'Name',
                                                                                                luvioSelections:
                                                                                                    [
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
                                                                        value: 'Account9',
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
                                                                    name: 'Id',
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
                                                                {
                                                                    kind: 'ObjectFieldSelection',
                                                                    name: 'Owner',
                                                                    luvioSelections: [
                                                                        {
                                                                            kind: 'ObjectFieldSelection',
                                                                            name: 'edges',
                                                                            luvioSelections: [
                                                                                {
                                                                                    kind: 'ObjectFieldSelection',
                                                                                    name: 'node',
                                                                                    luvioSelections:
                                                                                        [
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'Id',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ScalarFieldSelection',
                                                                                                name: 'WeakEtag',
                                                                                            },
                                                                                            {
                                                                                                kind: 'ObjectFieldSelection',
                                                                                                name: 'Name',
                                                                                                luvioSelections:
                                                                                                    [
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
                                                                        value: 'Account10',
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

        run(() => {
            astToString(ast);
        });
    });
});
