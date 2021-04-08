import { DirectiveNode } from 'graphql/language';
import { LuvioDirectiveNode } from './ast';
import { transform as transformArgumentNode } from './argument-node';
import { CUSTOM_DIRECTIVE_CONNECTION, CUSTOM_DIRECTIVE_RESOURCE } from './constants';

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

export function isCustomDirective(node: DirectiveNode): boolean {
    return (
        node.name.value === CUSTOM_DIRECTIVE_CONNECTION ||
        node.name.value === CUSTOM_DIRECTIVE_RESOURCE
    );
}
