import { ArgumentNode } from 'graphql/language';
import { LuvioArgumentNode } from './ast';
import { TransformState } from './operation/query';
import { transform as transformValueNode } from './value-node';

export function transform(node: ArgumentNode, transformState: TransformState): LuvioArgumentNode {
    const {
        kind,
        name: { value: nodeName },
        value: nodeValue,
    } = node;
    const valueNode = transformValueNode(nodeValue, transformState);
    return {
        kind,
        name: nodeName,
        value: valueNode,
    };
}
