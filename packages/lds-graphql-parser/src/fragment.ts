import { FragmentDefinitionNode } from 'graphql/language';
import { LuvioFieldNode, LuvioFragmentDefinitionNode } from './ast';
import { fieldVisitor } from './visitor';

export function transform(node: FragmentDefinitionNode): LuvioFragmentDefinitionNode {
    // TODO transform variableDefinitions and directives

    // dummy root node
    const fragmentRoot: LuvioFieldNode = {
        kind: 'ObjectFieldSelection',
        name: 'fragment',
        luvioSelections: [],
    };
    const currentNodePath: LuvioFieldNode[] = [fragmentRoot];

    fieldVisitor(node, currentNodePath);

    const luvioNode: LuvioFragmentDefinitionNode = {
        kind: node.kind,
        name: node.name.value,
        typeCondition: {
            kind: node.typeCondition.kind,
            name: node.typeCondition.name.value,
        },
        luvioSelections: fragmentRoot.luvioSelections!,
    };

    return luvioNode;
}
