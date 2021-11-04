import { InlineFragmentNode } from 'graphql/language';
import { LuvioInlineFragmentNode } from './ast';
import { transform as transformDirectiveNode } from './directive-node';
import { TransformState } from './operation/query';

export function transform(
    node: InlineFragmentNode,
    transformState: TransformState
): LuvioInlineFragmentNode {
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
        luvioNode.directives = directives.map((directive) =>
            transformDirectiveNode(directive, transformState)
        );
    }

    return luvioNode;
}
