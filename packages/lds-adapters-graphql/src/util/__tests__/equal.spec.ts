import { LuvioSelectionObjectFieldNode } from '@salesforce/lds-graphql-parser';
import { equals, scalarFieldEquals } from '../equal';

describe('Equals', () => {
    describe('scalarFieldEquals', () => {
        it('should return true when scalar values are equal', () => {
            const result = scalarFieldEquals(
                {
                    kind: 'ScalarFieldSelection',
                    name: 'value',
                },
                {},
                {
                    value: 'foo',
                },
                {
                    value: 'foo',
                }
            );
            expect(result).toBe(true);
        });

        it('should return false when scalar values are not equal', () => {
            const result = scalarFieldEquals(
                {
                    kind: 'ScalarFieldSelection',
                    name: 'value',
                },
                {},
                {
                    value: 'foo',
                },
                {
                    value: 'bar',
                }
            );
            expect(result).toBe(false);
        });

        it('should return true when incoming value is equal and was originally behind an alias', () => {
            const result = scalarFieldEquals(
                {
                    kind: 'ScalarFieldSelection',
                    name: 'value',
                    alias: 'alias',
                },
                {},
                {
                    value: 'foo',
                },
                {
                    value: 'foo',
                }
            );
            expect(result).toBe(true);
        });

        it('should THROW if incoming value has not yet normalized aliases', () => {
            expect(() => {
                scalarFieldEquals(
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'value',
                        alias: 'alias',
                    },
                    {},
                    {
                        value: 'foo',
                    },
                    {
                        alias: 'foo',
                    }
                );
            }).toThrow(
                'Invalid alias "alias" passed to "equal" function. All aliases need to be normalized before calling equal'
            );
        });
    });

    describe('equals', () => {
        it('should return true when two objects are identical', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'edges',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: '__typename',
                    },
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'title',
                    },
                ],
            };

            const result = equals(
                ast,
                {},
                {
                    __typename: 'typename',
                    title: 'title',
                },
                {
                    __typename: 'typename',
                    title: 'title',
                }
            );

            expect(result).toBe(true);
        });

        it('should return false when two objects are not identical', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'edges',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: '__typename',
                    },
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'title',
                    },
                ],
            };

            const result = equals(
                ast,
                {},
                {
                    __typename: 'typename',
                    title: 'title',
                },
                {
                    __typename: 'typename',
                    title: 'different',
                }
            );

            expect(result).toBe(false);
        });

        it('should return false when two identical objects have child links that are different', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'edges',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: '__typename',
                    },
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'title',
                    },
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'object',
                        luvioSelections: [
                            {
                                name: 'child',
                                kind: 'ScalarFieldSelection',
                            },
                        ],
                    },
                ],
            };

            const result = equals(
                ast,
                {},
                {
                    __typename: 'typename',
                    title: 'title',
                    object: {
                        __ref: 'link',
                    },
                },
                {
                    __typename: 'typename',
                    title: 'title',
                    object: {
                        __ref: 'different',
                    },
                }
            );

            expect(result).toBe(false);
        });

        it('should return true when two identical objects have child links that are identical', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'edges',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: '__typename',
                    },
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'title',
                    },
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'object',
                        luvioSelections: [
                            {
                                name: 'child',
                                kind: 'ScalarFieldSelection',
                            },
                        ],
                    },
                ],
            };

            const result = equals(
                ast,
                {},
                {
                    __typename: 'typename',
                    title: 'title',
                    object: {
                        __ref: 'link',
                    },
                },
                {
                    __typename: 'typename',
                    title: 'title',
                    object: {
                        __ref: 'link',
                    },
                }
            );

            expect(result).toBe(true);
        });

        it('should return true when two values contain identical child links that contain arguments', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'foo',
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'child',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'title',
                            },
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'scalar',
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
            };

            const result = equals(
                ast,
                {},
                {
                    scalar: 'string',
                    'child(where:{Name:{like:"Account1"}})': {
                        __ref: 'toplevel__child',
                    },
                },
                {
                    scalar: 'string',
                    'child(where:{Name:{like:"Account1"}})': {
                        __ref: 'toplevel__child',
                    },
                }
            );

            expect(result).toBe(true);
        });

        it('should return true when two values contain different child links that contain arguments', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'foo',
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'child',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'title',
                            },
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'scalar',
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
            };

            const result = equals(
                ast,
                {},
                {
                    scalar: 'string',
                    'child(where:{Name:{like:"Account1"}})': {
                        __ref: 'toplevel__child',
                    },
                },
                {
                    scalar: 'string',
                    'child(where:{Name:{like:"Account1"}})': {
                        __ref: 'something__different',
                    },
                }
            );

            expect(result).toBe(false);
        });

        it('should return true when two values contain identical child links that contain arguments referencing variables', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'foo',
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'child',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'title',
                            },
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'scalar',
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
                                                    name: 'variableName',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    },
                ],
            };

            const result = equals(
                ast,
                {
                    variableName: 'valueFromVariable',
                },
                {
                    scalar: 'string',
                    'child(where:{Name:{like:"valueFromVariable"}})': {
                        __ref: 'toplevel__child',
                    },
                },
                {
                    scalar: 'string',
                    'child(where:{Name:{like:"valueFromVariable"}})': {
                        __ref: 'toplevel__child',
                    },
                }
            );

            expect(result).toBe(true);
        });
    });
});
