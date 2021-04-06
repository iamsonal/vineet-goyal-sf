import { ASTNode, DirectiveNode, StringValueNode, visit } from 'graphql/language';
import { LuvioFieldNode } from './ast';
import { transform as transformArgumentNode } from './argument-node';
import { transform as transformDirectiveNode } from './directive-node';

export function fieldVisitor(ast: ASTNode, path: LuvioFieldNode[]) {
    visit(ast, {
        enter(node, _key, _parent, _path, _ancestors) {
            if (node.kind === 'Field') {
                const { name, arguments: fieldArgs, selectionSet, directives } = node;

                let selectionNode: LuvioFieldNode = {
                    kind: 'ObjectFieldSelection',
                    name: name.value,
                    luvioSelections: [],
                };

                if (selectionSet === undefined || selectionSet.selections.length === 0) {
                    selectionNode = {
                        kind: 'ScalarFieldSelection',
                        name: name.value,
                    };
                } else if (directives !== undefined && directives.length > 0) {
                    let resourceDirective: DirectiveNode;
                    if (
                        directives.find(directive => {
                            return directive.name.value === 'connection';
                        })
                    ) {
                        selectionNode = {
                            kind: 'CustomFieldSelection',
                            name: name.value,
                            type: 'Connection',
                            luvioSelections: [],
                        };
                    } else if (
                        directives.find(directive => {
                            if (directive.name.value === 'resource') {
                                resourceDirective = directive;
                                return true;
                            }
                            return false;
                        })
                    ) {
                        selectionNode = {
                            kind: 'CustomFieldSelection',
                            name: name.value,
                            type: (resourceDirective!.arguments![0].value as StringValueNode).value,
                            luvioSelections: [],
                        };
                    } else {
                        // transform non client-side directives
                        selectionNode.directives = directives.map(transformDirectiveNode);
                    }
                }

                if (selectionNode.kind !== 'ScalarFieldSelection') {
                    if (fieldArgs !== undefined && fieldArgs.length > 0) {
                        selectionNode.arguments = fieldArgs.map(transformArgumentNode);
                    }
                }

                const parentNode = path[path.length - 1];
                if (
                    parentNode.kind === 'ObjectFieldSelection' ||
                    parentNode.kind === 'CustomFieldSelection'
                ) {
                    parentNode.luvioSelections!.push(selectionNode);
                }

                path.push(selectionNode);
            }
        },
        leave(node, _key, _parent, _path, _ancestors) {
            if (node.kind === 'Field') {
                path.pop();
            }
        },
    });
}
