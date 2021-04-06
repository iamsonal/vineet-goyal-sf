import { OperationDefinitionNode } from 'graphql/language';
import { LuvioFieldNode, LuvioOperationDefinitionNode } from '../../ast';
import { fieldVisitor } from '../../visitor';
import { transform as transformVariableDefinition } from '../../variable-definition';
import { transform as transformDirectiveNode } from '../../directive-node';

export function transform(node: OperationDefinitionNode): LuvioOperationDefinitionNode {
    const queryRoot: LuvioFieldNode = {
        kind: 'ObjectFieldSelection',
        name: 'query',
        luvioSelections: [],
    };
    const currentNodePath: LuvioFieldNode[] = [queryRoot];

    fieldVisitor(node, currentNodePath);

    const operationDefinition: LuvioOperationDefinitionNode = {
        kind: 'OperationDefinition',
        operation: 'query',
        name: node.name?.value || 'operationName',
        luvioSelections: queryRoot.luvioSelections!,
    };

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
