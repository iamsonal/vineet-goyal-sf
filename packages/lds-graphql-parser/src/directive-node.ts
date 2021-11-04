import { DirectiveNode } from 'graphql/language';
import { LuvioArgumentNode, LuvioDirectiveNode } from './ast';
import { transform as transformArgumentNode } from './argument-node';
import { CUSTOM_DIRECTIVE_CONNECTION, CUSTOM_DIRECTIVE_RESOURCE } from './constants';
import { TransformState } from './operation/query';

export function transform(node: DirectiveNode, transformState: TransformState): LuvioDirectiveNode {
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
        let returnArguments: LuvioArgumentNode[] = [];
        for (var index = 0; index < nodeArguments.length; index++) {
            const argumentNode = nodeArguments[index];
            const value = transformArgumentNode(argumentNode, transformState);
            returnArguments.push(value);
        }
        ret.arguments = returnArguments;
    }

    return ret;
}

export function isCustomDirective(node: DirectiveNode): boolean {
    return (
        node.name.value === CUSTOM_DIRECTIVE_CONNECTION ||
        node.name.value === CUSTOM_DIRECTIVE_RESOURCE
    );
}
