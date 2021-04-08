import { FragmentDefinitionNode } from 'graphql/language';
import { LuvioFieldNode, LuvioFragmentDefinitionNode, LuvioSelectionNode } from './ast';
import { selectionSetVisitor } from './visitor';
import { transform as transformVariableDefinition } from './variable-definition';
import { transform as transformDirectiveNode } from './directive-node';
import { NODE_KIND_OBJECT_FIELD_SELECTION } from './constants';

export function transform(node: FragmentDefinitionNode): LuvioFragmentDefinitionNode {
    const {
        kind: nodeKind,
        name: { value: nodeName },
        typeCondition: {
            kind: typeKind,
            name: { value: typeName },
        },
        variableDefinitions,
        directives,
    } = node;

    // dummy root node
    const fragmentRoot: LuvioFieldNode = {
        kind: NODE_KIND_OBJECT_FIELD_SELECTION,
        name: 'fragment',
        luvioSelections: [],
    };
    const currentNodePath: LuvioSelectionNode[] = [fragmentRoot];

    selectionSetVisitor(node, currentNodePath);

    const luvioNode: LuvioFragmentDefinitionNode = {
        kind: nodeKind,
        name: nodeName,
        typeCondition: {
            kind: typeKind,
            name: typeName,
        },
        luvioSelections: fragmentRoot.luvioSelections!,
    };

    if (variableDefinitions !== undefined && variableDefinitions.length > 0) {
        luvioNode.variableDefinitions = variableDefinitions.map(transformVariableDefinition);
    }

    if (directives !== undefined && directives.length > 0) {
        luvioNode.directives = directives.map(transformDirectiveNode);
    }

    return luvioNode;
}
