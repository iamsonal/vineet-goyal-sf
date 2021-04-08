import { InlineFragmentNode } from 'graphql/language';
import { LuvioInlineFragmentNode } from './ast';
import { transform as transformDirectiveNode } from './directive-node';

export function transform(node: InlineFragmentNode): LuvioInlineFragmentNode {
    const { kind: nodeKind, typeCondition, directives } = node;

    const luvioNode: LuvioInlineFragmentNode = {
        kind: nodeKind,
        luvioSelections: [],
    };

    if (typeCondition !== undefined) {
        luvioNode.typeCondition = {
            kind: typeCondition.kind,
            name: typeCondition.name.value,
        };
    }

    if (directives !== undefined && directives.length > 0) {
        luvioNode.directives = directives.map(transformDirectiveNode);
    }

    return luvioNode;
}
