import { isOperationDefinitionNode, isFragmentDefinitionNode } from '../ast';

describe('Luvio GraphQL AST', () => {
    describe('utility functions', () => {
        it('isOperationDefinitionNode returns true if input is GrahpQL OperationDefinitionNode', () => {
            const target = isOperationDefinitionNode({
                kind: 'OperationDefinition',
                operation: 'query',
                selectionSet: {
                    kind: 'SelectionSet',
                    selections: [],
                },
            });
            expect(target).toBe(true);
        });

        it('isOperationDefinitionNode returns false if input is not GrahpQL OperationDefinitionNode', () => {
            const target = isOperationDefinitionNode({
                kind: 'FragmentDefinition',
                name: { kind: 'Name', value: 'test' },
                typeCondition: {
                    kind: 'NamedType',
                    name: { kind: 'Name', value: 'testType' },
                },
                selectionSet: {
                    kind: 'SelectionSet',
                    selections: [],
                },
            });
            expect(target).toBe(false);
        });

        it('isFragmentDefinitionNode returns true if input is GrahpQL FragmentDefinitionNode', () => {
            const target = isFragmentDefinitionNode({
                kind: 'FragmentDefinition',
                name: { kind: 'Name', value: 'test' },
                typeCondition: {
                    kind: 'NamedType',
                    name: { kind: 'Name', value: 'testType' },
                },
                selectionSet: {
                    kind: 'SelectionSet',
                    selections: [],
                },
            });
            expect(target).toBe(true);
        });

        it('isFragmentDefinitionNode returns false if input is not GrahpQL FragmentDefinitionNode', () => {
            const target = isFragmentDefinitionNode({
                kind: 'OperationDefinition',
                operation: 'query',
                selectionSet: {
                    kind: 'SelectionSet',
                    selections: [],
                },
            });
            expect(target).toBe(false);
        });
    });
});
