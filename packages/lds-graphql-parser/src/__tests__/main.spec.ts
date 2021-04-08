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

        it('transforms variable definitions', () => {
            const source = `
            query HeroNameAndFriends($episode: Episode = JEDI) {
                hero(episode: $episode) {
                  name
                  friends {
                    name
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
                        name: 'HeroNameAndFriends',
                        luvioSelections: [
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'hero',
                                luvioSelections: [
                                    { kind: 'ScalarFieldSelection', name: 'name' },
                                    {
                                        kind: 'ObjectFieldSelection',
                                        name: 'friends',
                                        luvioSelections: [
                                            { kind: 'ScalarFieldSelection', name: 'name' },
                                        ],
                                    },
                                ],
                                arguments: [
                                    {
                                        kind: 'Argument',
                                        name: 'episode',
                                        value: { kind: 'Variable', name: 'episode' },
                                    },
                                ],
                            },
                        ],
                        variableDefinitions: [
                            {
                                kind: 'VariableDefinition',
                                variable: { kind: 'Variable', name: 'episode' },
                                type: { kind: 'NamedType', name: 'Episode' },
                                defaultValue: { kind: 'EnumValue', value: 'JEDI' },
                            },
                        ],
                    },
                ],
            };

            const target = parser.default(source);

            expect(target).toStrictEqual(expected);
        });

        it('transform directives', () => {
            const source = `
            query Hero($episode: Episode, $withFriends: Boolean!) {
                hero(episode: $episode) {
                  name
                  friends @include(if: $withFriends) {
                    name
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
                        name: 'Hero',
                        luvioSelections: [
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'hero',
                                luvioSelections: [
                                    { kind: 'ScalarFieldSelection', name: 'name' },
                                    {
                                        kind: 'ObjectFieldSelection',
                                        name: 'friends',
                                        luvioSelections: [
                                            { kind: 'ScalarFieldSelection', name: 'name' },
                                        ],
                                        directives: [
                                            {
                                                kind: 'Directive',
                                                name: 'include',
                                                arguments: [
                                                    {
                                                        kind: 'Argument',
                                                        name: 'if',
                                                        value: {
                                                            kind: 'Variable',
                                                            name: 'withFriends',
                                                        },
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                                arguments: [
                                    {
                                        kind: 'Argument',
                                        name: 'episode',
                                        value: { kind: 'Variable', name: 'episode' },
                                    },
                                ],
                            },
                        ],
                        variableDefinitions: [
                            {
                                kind: 'VariableDefinition',
                                variable: { kind: 'Variable', name: 'episode' },
                                type: { kind: 'NamedType', name: 'Episode' },
                            },
                            {
                                kind: 'VariableDefinition',
                                variable: { kind: 'Variable', name: 'withFriends' },
                                type: {
                                    kind: 'NonNullType',
                                    type: { kind: 'NamedType', name: 'Boolean' },
                                },
                            },
                        ],
                    },
                ],
            };

            const target = parser.default(source);

            expect(target).toStrictEqual(expected);
        });

        it('transform fragment spread', () => {
            const source = `
            {
              aliasTest: hero(episode: EMPIRE) {
                  ...nameField
                  appearsIn
              }
            }
                          
            fragment nameField on Character {
              name
            }
            `;

            const expected = {
                kind: 'Document',
                definitions: [
                    {
                        kind: 'OperationDefinition',
                        operation: 'query',
                        luvioSelections: [
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'hero',
                                luvioSelections: [
                                    { kind: 'FragmentSpread', name: 'nameField' },
                                    { kind: 'ScalarFieldSelection', name: 'appearsIn' },
                                ],
                                arguments: [
                                    {
                                        kind: 'Argument',
                                        name: 'episode',
                                        value: { kind: 'EnumValue', value: 'EMPIRE' },
                                    },
                                ],
                                alias: 'aliasTest',
                            },
                        ],
                    },
                    {
                        kind: 'FragmentDefinition',
                        name: 'nameField',
                        typeCondition: { kind: 'NamedType', name: 'Character' },
                        luvioSelections: [{ kind: 'ScalarFieldSelection', name: 'name' }],
                    },
                ],
            };

            const target = parser.default(source);

            expect(target).toStrictEqual(expected);
        });

        it('transform inline fragment', () => {
            const source = `
            query HeroForEpisode($ep: Episode!) {
              hero(episode: $ep) {
                name
                ... on Droid {
                  primaryFunction
                }
                ... on Human {
                  height
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
                        luvioSelections: [
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'hero',
                                luvioSelections: [
                                    { kind: 'ScalarFieldSelection', name: 'name' },
                                    {
                                        kind: 'InlineFragment',
                                        luvioSelections: [
                                            {
                                                kind: 'ScalarFieldSelection',
                                                name: 'primaryFunction',
                                            },
                                        ],
                                        typeCondition: { kind: 'NamedType', name: 'Droid' },
                                    },
                                    {
                                        kind: 'InlineFragment',
                                        luvioSelections: [
                                            { kind: 'ScalarFieldSelection', name: 'height' },
                                        ],
                                        typeCondition: { kind: 'NamedType', name: 'Human' },
                                    },
                                ],
                                arguments: [
                                    {
                                        kind: 'Argument',
                                        name: 'episode',
                                        value: { kind: 'Variable', name: 'ep' },
                                    },
                                ],
                            },
                        ],
                        name: 'HeroForEpisode',
                        variableDefinitions: [
                            {
                                kind: 'VariableDefinition',
                                variable: { kind: 'Variable', name: 'ep' },
                                type: {
                                    kind: 'NonNullType',
                                    type: { kind: 'NamedType', name: 'Episode' },
                                },
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
