import { TypeNode } from 'graphql/language';
import { isListTypeNode, isNamedTypeNode, isNonNullTypeNode, LuvioTypeNode } from './ast';

export function transform(node: TypeNode): LuvioTypeNode {
    if (isNamedTypeNode(node)) {
        return {
            kind: 'NamedType',
            name: node.name.value,
        };
    } else if (isListTypeNode(node)) {
        return {
            kind: 'ListType',
            type: transform(node.type),
        };
    } else if (isNonNullTypeNode(node)) {
        if (isNamedTypeNode(node.type)) {
            return {
                kind: 'NonNullType',
                type: {
                    kind: 'NamedType',
                    name: node.type.name.value,
                },
            };
        } else if (isListTypeNode(node.type)) {
            return {
                kind: 'NonNullType',
                type: {
                    kind: 'ListType',
                    type: transform(node.type.type),
                },
            };
        } else {
            throw new Error('Unsupported NonNullTypeNode');
        }
    } else {
        throw new Error('Unsupported TypeNode');
    }
}
