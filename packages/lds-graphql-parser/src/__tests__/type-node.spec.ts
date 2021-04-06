import { NamedTypeNode, TypeNode } from 'graphql/language';
import { transform } from '../type-node';

describe('Luvio GraphQL TypeNode transform', () => {
    it('returns LuvioTypeNode when input is GraphQL NamedTypeNode', () => {
        expect(
            transform({
                kind: 'NamedType',
                name: {
                    kind: 'Name',
                    value: 'test',
                },
            })
        ).toStrictEqual({
            kind: 'NamedType',
            name: 'test',
        });
    });

    it('returns LuvioTypeNode when input is GraphQL ListTypeNode', () => {
        expect(
            transform({
                kind: 'ListType',
                type: {
                    kind: 'NamedType',
                    name: {
                        kind: 'Name',
                        value: 'test',
                    },
                },
            })
        ).toStrictEqual({
            kind: 'ListType',
            type: {
                kind: 'NamedType',
                name: 'test',
            },
        });
    });

    it('returns LuvioTypeNode when input is GraphQL NonNullTypeNode', () => {
        expect(
            transform({
                kind: 'NonNullType',
                type: {
                    kind: 'NamedType',
                    name: {
                        kind: 'Name',
                        value: 'test',
                    },
                },
            })
        ).toStrictEqual({
            kind: 'NonNullType',
            type: {
                kind: 'NamedType',
                name: 'test',
            },
        });
    });

    it('throws when input is unsupported TypeNode', () => {
        expect(() =>
            transform(({
                kind: 'Unknown',
                name: 'test',
            } as unknown) as TypeNode)
        ).toThrowError('Unsupported TypeNode');
    });

    it('throws when input is unsupported NonNullTypeNode', () => {
        expect(() =>
            transform({
                kind: 'NonNullType',
                type: ({
                    kind: 'Unknown',
                    name: 'test',
                } as unknown) as NamedTypeNode,
            })
        ).toThrowError('Unsupported NonNullTypeNode');
    });
});
