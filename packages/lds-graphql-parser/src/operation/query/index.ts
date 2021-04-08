import { OperationDefinitionNode } from 'graphql/language';
import { LuvioFieldNode, LuvioOperationDefinitionNode, LuvioSelectionNode } from '../../ast';
import { selectionSetVisitor } from '../../visitor';
import { transform as transformVariableDefinition } from '../../variable-definition';
import { transform as transformDirectiveNode } from '../../directive-node';

export function transform(node: OperationDefinitionNode): LuvioOperationDefinitionNode {
    const queryRoot: LuvioFieldNode = {
        kind: 'ObjectFieldSelection',
        name: 'query',
        luvioSelections: [],
    };
    const currentNodePath: LuvioSelectionNode[] = [queryRoot];

    selectionSetVisitor(node, currentNodePath);

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
        operationDefinition.variableDefinitions = variableDefinitions.map(
            transformVariableDefinition
        );
    }

    if (directives !== undefined && directives.length > 0) {
        operationDefinition.directives = directives.map(transformDirectiveNode);
    }

    return operationDefinition;
}
