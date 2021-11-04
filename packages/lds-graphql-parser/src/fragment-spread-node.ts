import { FragmentSpreadNode } from 'graphql/language';
import { LuvioFragmentSpreadNode } from './ast';
import { transform as transformDirectiveNode } from './directive-node';
import { TransformState } from './operation/query';

export function transform(
    node: FragmentSpreadNode,
    transformState: TransformState
): LuvioFragmentSpreadNode {
    const {
        kind,
        name: { value },
        directives,
    } = node;

    const luvioNode: LuvioFragmentSpreadNode = {
        kind,
        name: value,
    };

    if (directives !== undefined && directives.length > 0) {
        luvioNode.directives = directives.map((directive) =>
            transformDirectiveNode(directive, transformState)
        );
    }

    return luvioNode;
}
