import { TypeNode } from 'graphql/language';
import { isListTypeNode, isNamedTypeNode, isNonNullTypeNode, LuvioTypeNode } from './ast';
import { NODE_KIND_NAMED_TYPE, NODE_KIND_LIST_TYPE, NODE_KIND_NON_NULL_TYPE } from './constants';

export function transform(node: TypeNode): LuvioTypeNode {
    if (isNamedTypeNode(node)) {
        return {
            kind: NODE_KIND_NAMED_TYPE,
            name: node.name.value,
        };
    } else if (isListTypeNode(node)) {
        return {
            kind: NODE_KIND_LIST_TYPE,
            type: transform(node.type),
        };
    } else if (isNonNullTypeNode(node)) {
        if (isNamedTypeNode(node.type)) {
            return {
                kind: NODE_KIND_NON_NULL_TYPE,
                type: {
                    kind: NODE_KIND_NAMED_TYPE,
                    name: node.type.name.value,
                },
            };
        } else if (isListTypeNode(node.type)) {
            return {
                kind: NODE_KIND_NON_NULL_TYPE,
                type: {
                    kind: NODE_KIND_LIST_TYPE,
                    type: transform(node.type.type),
                },
            };
        } else {
            // eslint-disable-next-line @salesforce/lds/no-error-in-production
            throw new Error('Unsupported NonNullTypeNode');
        }
    } else {
        // eslint-disable-next-line @salesforce/lds/no-error-in-production
        throw new Error('Unsupported TypeNode');
    }
}
