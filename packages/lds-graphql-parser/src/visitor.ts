import { ASTNode, ASTVisitor, visit } from 'graphql/language';
import { LuvioSelectionNode } from './ast';
import {
    NODE_KIND_CUSTOM_FIELD_SELECTION,
    NODE_KIND_FIELD,
    NODE_KIND_FRAGMENT_SPREAD,
    NODE_KIND_INLINE_FRAGMENT,
    NODE_KIND_OBJECT_FIELD_SELECTION,
} from './constants';
import { transform as transformFieldNode } from './field-node';
import { transform as transformFragmentSpreadNode } from './fragment-spread-node';
import { transform as transformInlineFragmentNode } from './inline-fragment-node';
import { TransformState } from './operation/query';

export function selectionSetVisitor(
    ast: ASTNode,
    luvioSelectionPath: LuvioSelectionNode[],
    transformState: TransformState
): void {
    const visitor: ASTVisitor = {
        enter(node) {
            let selectionNode: LuvioSelectionNode | undefined;
            switch (node.kind) {
                case NODE_KIND_FIELD: {
                    const fieldNode = transformFieldNode(node, transformState);
                    selectionNode = fieldNode;
                    break;
                }
                case NODE_KIND_FRAGMENT_SPREAD:
                    selectionNode = transformFragmentSpreadNode(node, transformState);
                    break;
                case NODE_KIND_INLINE_FRAGMENT:
                    selectionNode = transformInlineFragmentNode(node, transformState);
                    break;
            }

            if (selectionNode !== undefined) {
                const parentNode = luvioSelectionPath[luvioSelectionPath.length - 1];
                if (
                    parentNode.kind === NODE_KIND_OBJECT_FIELD_SELECTION ||
                    parentNode.kind === NODE_KIND_CUSTOM_FIELD_SELECTION ||
                    parentNode.kind === NODE_KIND_INLINE_FRAGMENT
                ) {
                    parentNode.luvioSelections!.push(selectionNode);
                }

                luvioSelectionPath.push(selectionNode);
            }
        },
        leave(node) {
            switch (node.kind) {
                case NODE_KIND_FIELD:
                case NODE_KIND_FRAGMENT_SPREAD:
                case NODE_KIND_INLINE_FRAGMENT:
                    luvioSelectionPath.pop();
                    break;
            }
        },
    };

    visit(ast, visitor);
}
