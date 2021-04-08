import { FragmentSpreadNode } from 'graphql/language';
import { LuvioFragmentSpreadNode } from './ast';
import { transform as transformDirectiveNode } from './directive-node';

export function transform(node: FragmentSpreadNode): LuvioFragmentSpreadNode {
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
        luvioNode.directives = directives.map(transformDirectiveNode);
    }

    return luvioNode;
}
