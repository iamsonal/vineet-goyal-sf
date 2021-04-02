import { OperationDefinitionNode } from 'graphql/language';
import {
    LuvioFieldNode,
    LuvioOperationDefinitionNode,
    LuvioVariableDefinitionNode,
} from '../../ast';
import { fieldVisitor } from '../../visitor';

export function transform(node: OperationDefinitionNode): LuvioOperationDefinitionNode {
    // TODO transform VariableDefinitionNode
    const variableDeclarations: LuvioVariableDefinitionNode[] = [];

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
        variableDefinitions: variableDeclarations,
        name: node.name?.value || 'operationName',
        luvioSelections: queryRoot.luvioSelections!,
    };

    return operationDefinition;
}
