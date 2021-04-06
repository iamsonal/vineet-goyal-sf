import * as parser from '../main';

describe('LDS GraphQL Parser', () => {
    describe('parseAndVisit', () => {
        it('transforms GraphQL operation into a custom AST', () => {
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

        it('transforms GraphQL fragment into a custom AST', () => {
            const source = `
            fragment requiredFields on Record{
                id,
                WeakEtag,
                ApiName,
                DisplayValue,
                LastModifiedById {
                  value
                }
                LastModifiedDate {
                    value
                }
                SystemModstamp {
                  value
                }
                RecordTypeId {
                  value
                }
              }
            `;

            const expected = {
                kind: 'Document',
                definitions: [
                    {
                        kind: 'FragmentDefinition',
                        name: 'requiredFields',
                        typeCondition: { kind: 'NamedType', name: 'Record' },
                        luvioSelections: [
                            { kind: 'ScalarFieldSelection', name: 'id' },
                            { kind: 'ScalarFieldSelection', name: 'WeakEtag' },
                            { kind: 'ScalarFieldSelection', name: 'ApiName' },
                            { kind: 'ScalarFieldSelection', name: 'DisplayValue' },
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'LastModifiedById',
                                luvioSelections: [{ kind: 'ScalarFieldSelection', name: 'value' }],
                            },
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'LastModifiedDate',
                                luvioSelections: [{ kind: 'ScalarFieldSelection', name: 'value' }],
                            },
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'SystemModstamp',
                                luvioSelections: [{ kind: 'ScalarFieldSelection', name: 'value' }],
                            },
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'RecordTypeId',
                                luvioSelections: [{ kind: 'ScalarFieldSelection', name: 'value' }],
                            },
                        ],
                    },
                ],
            };

            const target = parser.default(source);
            expect(target).toStrictEqual(expected);
        });

        it('throws an error for unsupported GraphQL definition', () => {
            const source = `
            type Character {
                name: String!
                appearsIn: [Episode!]!
            }
            `;

            expect(() => parser.default(source)).toThrowError(
                'Unsupported ObjectTypeDefinition definition. Only OperationDefinition and FragmentDefinition are supported in a GraphQL Document'
            );
        });

        it('throws an error for unsupported GraphQL operation definition', () => {
            const source = `
            mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
                createReview(episode: $ep, review: $review) {
                  stars
                  commentary
                }
            }
            `;

            expect(() => parser.default(source)).toThrowError(
                'Unsupported mutation operation. Only query operation is supported'
            );
        });
    });
});
