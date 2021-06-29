import { LuvioVariableDefinitionNode } from '@salesforce/lds-graphql-parser';
import { GraphQLVariables, validateVariableDefinitions } from '../Variable';

describe('validateVariableDefinitions', () => {
    it('should not throw any error when no variable definitions are present', () => {
        const variableDefinitions = [];
        const variables = {} as GraphQLVariables;
        expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual([]);
    });

    it('should not throw any error when a variable definition is present and value is provided for it', () => {
        const variableDefinitions: LuvioVariableDefinitionNode[] = [
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
            },
        ];
        const variables = {
            accountName: 'Account1',
        };
        expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual([]);
    });

    it('should not throw any error when multiple variable definitions are present and values are provided for them', () => {
        const variableDefinitions: LuvioVariableDefinitionNode[] = [
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
            },
            {
                kind: 'VariableDefinition',
                variable: {
                    kind: 'Variable',
                    name: 'Id',
                },
                type: {
                    kind: 'NamedType',
                    name: 'ID',
                },
            },
        ];
        const variables = {
            accountName: 'Account1',
            Id: '001RM000004uuhnYAA',
        };
        expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual([]);
    });

    it('should not throw an error when extra values provided compared to variable definitions', () => {
        const variableDefinitions: LuvioVariableDefinitionNode[] = [
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
            },
            {
                kind: 'VariableDefinition',
                variable: {
                    kind: 'Variable',
                    name: 'Id',
                },
                type: {
                    kind: 'NamedType',
                    name: 'ID',
                },
            },
        ];
        const variables = {
            accountName: 'Account1',
            Id: '001RM000004uuhnYAA',
            Id2: '001RM000004uuhnYAA',
        };

        expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual([]);
    });

    describe('named type', () => {
        it('should not throw an error when a null value is provided for an optional variable definition', () => {
            const variableDefinitions: LuvioVariableDefinitionNode[] = [
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
                },
            ];
            const variables = {
                accountName: null,
            };
            expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual([]);
        });

        it("should not throw an error when a value isn't provided for an optional variable definition", () => {
            const variableDefinitions: LuvioVariableDefinitionNode[] = [
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
                },
                {
                    kind: 'VariableDefinition',
                    variable: {
                        kind: 'Variable',
                        name: 'Id',
                    },
                    type: {
                        kind: 'NamedType',
                        name: 'ID',
                    },
                },
            ];
            const variables = {
                accountName: 'Account1',
                Id2: '001RM000004uuhnYAA',
            };
            expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual([]);
        });

        it('should throw an error when a variable definition is present and an undefined value is provided for it', () => {
            const variableDefinitions: LuvioVariableDefinitionNode[] = [
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
                },
            ];
            const variables = {
                accountName: undefined,
            };
            const expectedErrorMessages = [
                'Variable $accountName has an undefined value provided for it.',
            ];

            expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual(
                expectedErrorMessages
            );
        });
    });

    describe('list type', () => {
        it('should throw an error when scalar value provided for list type in variable definition', () => {
            const variableDefinitions: LuvioVariableDefinitionNode[] = [
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
                },
            ];
            const variables = {
                Id: '001RM000004uuhnYAA',
            };
            const expectedErrorMessages = ['Expected a list to be provided as value for $Id'];

            expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual(
                expectedErrorMessages
            );
        });

        it('should not throw an error when array value provided for list type in variable definition', () => {
            const variableDefinitions: LuvioVariableDefinitionNode[] = [
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
                },
            ];
            const variables = {
                Id: ['001RM000004uuhnYAA', '001RM000004uuhsYAA'],
            };

            expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual([]);
        });
    });

    describe('non-null type', () => {
        it('should not throw an error when a value is provided for a non-null variable definition', () => {
            const variableDefinitions: LuvioVariableDefinitionNode[] = [
                {
                    kind: 'VariableDefinition',
                    variable: {
                        kind: 'Variable',
                        name: 'accountName',
                    },
                    type: {
                        kind: 'NonNullType',
                        type: {
                            kind: 'NamedType',
                            name: 'String',
                        },
                    },
                },
            ];
            const variables = {
                accountName: 'Account1',
            };

            expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual([]);
        });

        it("should throw an error when a value isn't provided for a non-null variable definition", () => {
            const variableDefinitions: LuvioVariableDefinitionNode[] = [
                {
                    kind: 'VariableDefinition',
                    variable: {
                        kind: 'Variable',
                        name: 'Id',
                    },
                    type: {
                        kind: 'NonNullType',
                        type: {
                            kind: 'NamedType',
                            name: 'ID',
                        },
                    },
                },
            ];
            const variables = {};
            const expectedErrorMessages = [
                'Expected a non-null value to be provided as value for $Id',
            ];

            expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual(
                expectedErrorMessages
            );
        });

        it('should throw an error when a null value is provided for a non-null variable definition', () => {
            const variableDefinitions: LuvioVariableDefinitionNode[] = [
                {
                    kind: 'VariableDefinition',
                    variable: {
                        kind: 'Variable',
                        name: 'Id',
                    },
                    type: {
                        kind: 'NonNullType',
                        type: {
                            kind: 'NamedType',
                            name: 'ID',
                        },
                    },
                },
            ];
            const variables = {
                Id: null,
            };
            const expectedErrorMessages = [
                'Expected a non-null value to be provided as value for $Id',
            ];

            expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual(
                expectedErrorMessages
            );
        });

        it("should not throw an error when a value isn't provided for a non-null variable definition with a default value", () => {
            const variableDefinitions: LuvioVariableDefinitionNode[] = [
                {
                    kind: 'VariableDefinition',
                    variable: {
                        kind: 'Variable',
                        name: 'accountName',
                    },
                    type: {
                        kind: 'NonNullType',
                        type: {
                            kind: 'NamedType',
                            name: 'String',
                        },
                    },
                    defaultValue: {
                        kind: 'StringValue',
                        value: 'Account1',
                    },
                },
            ];
            const variables = {};

            expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual([]);
        });
    });

    it('should throw multiple errors when there are multiple validation issues', () => {
        const variableDefinitions: LuvioVariableDefinitionNode[] = [
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
            },
            {
                kind: 'VariableDefinition',
                variable: {
                    kind: 'Variable',
                    name: 'Id',
                },
                type: {
                    kind: 'NonNullType',
                    type: {
                        kind: 'NamedType',
                        name: 'ID',
                    },
                },
            },
        ];

        const variables = {
            accountName: undefined,
        };

        const expectedErrorMessages = [
            'Variable $accountName has an undefined value provided for it.',
            'Expected a non-null value to be provided as value for $Id',
        ];

        expect(validateVariableDefinitions(variableDefinitions, variables)).toEqual(
            expectedErrorMessages
        );
    });
});
