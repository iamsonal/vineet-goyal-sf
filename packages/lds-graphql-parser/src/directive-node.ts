import { DirectiveNode } from 'graphql/language';
import { LuvioDirectiveNode } from './ast';
import { transform as transformArgumentNode } from './argument-node';

export function transform(node: DirectiveNode): LuvioDirectiveNode {
    const {
        kind,
        name: { value: nodeName },
        arguments: nodeArguments,
    } = node;
    const ret: LuvioDirectiveNode = {
        kind,
        name: nodeName,
    };

    if (nodeArguments !== undefined && nodeArguments.length > 0) {
        ret.arguments = nodeArguments.map(transformArgumentNode);
    }

    return ret;
}
