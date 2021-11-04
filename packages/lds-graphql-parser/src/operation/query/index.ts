import { OperationDefinitionNode, VariableDefinitionNode } from 'graphql/language';
import { LuvioFieldNode, LuvioOperationDefinitionNode, LuvioSelectionNode } from '../../ast';
import { selectionSetVisitor } from '../../visitor';
import { transform as transformVariableDefinition } from '../../variable-definition';
import { transform as transformDirectiveNode } from '../../directive-node';

export interface TransformState {
    variablesUsed: Record<string, true>;
}

export function transform(node: OperationDefinitionNode): LuvioOperationDefinitionNode {
    const queryRoot: LuvioFieldNode = {
        kind: 'ObjectFieldSelection',
        name: 'query',
        luvioSelections: [],
    };
    const currentNodePath: LuvioSelectionNode[] = [queryRoot];

    const transformState = {
        variablesUsed: {},
    };
    selectionSetVisitor(node, currentNodePath, transformState);

    const operationDefinition: LuvioOperationDefinitionNode = {
        kind: 'OperationDefinition',
        operation: 'query',
        luvioSelections: queryRoot.luvioSelections!,
    };

    if (node.name !== undefined) {
        operationDefinition.name = node.name.value;
    }

    const { variableDefinitions, directives } = node;
    if (variableDefinitions !== undefined && variableDefinitions.length > 0) {
        operationDefinition.variableDefinitions = variableDefinitions.map((variableDefinition) =>
            transformVariableDefinition(variableDefinition, transformState)
        );
    }

    if (directives !== undefined && directives.length > 0) {
        operationDefinition.directives = directives.map((node) =>
            transformDirectiveNode(node, transformState)
        );
    }

    validateVariables(variableDefinitions, transformState);

    return operationDefinition;
}

function validateVariables(
    variableDefinitions: readonly VariableDefinitionNode[] | undefined,
    transformState: TransformState
) {
    const variablesDefined: Record<string, true> = {};

    if (variableDefinitions !== undefined) {
        for (let i = 0, len = variableDefinitions.length; i < len; i++) {
            const definedVariableName = variableDefinitions[i].variable.name.value;
            variablesDefined[definedVariableName] = true;
            if (transformState.variablesUsed[definedVariableName] === undefined) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error(`Variable $${definedVariableName} was defined but never used.`);
                }
            }
        }
    }

    const usedVariableKeys = Object.keys(transformState.variablesUsed);
    for (let i = 0, len = usedVariableKeys.length; i < len; i++) {
        if (variablesDefined[usedVariableKeys[i]] !== true) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error(`Variable $${usedVariableKeys[i]} was used but never defined.`);
            }
        }
    }
}
