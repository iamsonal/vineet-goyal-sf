import * as parser from '../main';

describe('LDS GraphQL Parser', () => {
    describe('parseAndVisit', () => {
        it('turns GraphQL string into a custom AST', () => {
            const source = `
            query {
                uiapi {
                    query {
                        Account(
                            where: { Name: { like: "Account1" } }
                        ) @connection {
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
            `;

            const expected = {
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
                                                                        kind:
                                                                            'ObjectFieldSelection',
                                                                        name: 'Name',
                                                                        luvioSelections: [
                                                                            {
                                                                                kind:
                                                                                    'ScalarFieldSelection',
                                                                                name: 'value',
                                                                            },
                                                                            {
                                                                                kind:
                                                                                    'ScalarFieldSelection',
                                                                                name:
                                                                                    'displayValue',
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

            const target = parser.default(source);

            expect(target).toStrictEqual(expected);
        });
    });
});
