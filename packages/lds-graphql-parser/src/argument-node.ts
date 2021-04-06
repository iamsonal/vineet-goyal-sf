import { ArgumentNode } from 'graphql/language';
import { LuvioArgumentNode } from './ast';
import { transform as transformValueNode } from './value-node';

export function transform(node: ArgumentNode): LuvioArgumentNode {
    const {
        kind,
        name: { value: nodeName },
        value: nodeValue,
    } = node;
    return {
        kind,
        name: nodeName,
        value: transformValueNode(nodeValue),
    };
}
