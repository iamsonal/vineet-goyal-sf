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
                        name: { kind: 'Name', value: 'operationName' },
                        selections: [
                            {
                                kind: 'ObjectField',
                                name: 'uiapi',
                                selections: [
                                    {
                                        kind: 'ObjectField',
                                        name: 'query',
                                        selections: [
                                            {
                                                kind: 'CustomField',
                                                name: 'Account',
                                                type: 'Connection',
                                                selections: [
                                                    {
                                                        kind: 'ObjectField',
                                                        name: 'edges',
                                                        selections: [
                                                            {
                                                                kind: 'CustomField',
                                                                name: 'node',
                                                                type: 'Record',
                                                                selections: [
                                                                    {
                                                                        kind: 'ObjectField',
                                                                        name: 'Name',
                                                                        selections: [
                                                                            {
                                                                                kind: 'ScalarField',
                                                                                name: 'value',
                                                                            },
                                                                            {
                                                                                kind: 'ScalarField',
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
                                                args: [
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
                                                                            kind: 'LiteralValue',
                                                                            type: 'string',
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
