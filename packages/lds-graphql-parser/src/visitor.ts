import {
    ArgumentNode,
    ASTNode,
    DirectiveNode,
    StringValueNode,
    ValueNode,
    VariableDefinitionNode,
    visit,
} from 'graphql/language';
import {
    LuvioFieldNode,
    LuvioDocumentNode,
    LuvioOperationDefinitionNode,
    LuvioArgumentNode,
    LuvioValueNode,
} from './ast';

function copyArguments(argNodes: readonly ArgumentNode[], target: LuvioArgumentNode[]) {
    for (let i = 0; i < argNodes.length; i++) {
        const argNode = argNodes[i];
        const arg: LuvioArgumentNode = {
            kind: 'Argument',
            name: argNode.name.value,
            value: getArgumentValue(argNode.value),
        };

        target.push(arg);
    }
}

function getArgumentValue(valueNode: ValueNode): LuvioValueNode {
    switch (valueNode.kind) {
        case 'Variable':
            return {
                kind: 'Variable',
                name: valueNode.name.value,
            };
        case 'IntValue':
            return {
                kind: 'IntValue',
                value: valueNode.value,
            };
        case 'FloatValue':
            return {
                kind: 'FloatValue',
                value: valueNode.value,
            };
        case 'StringValue':
            return {
                kind: 'StringValue',
                value: valueNode.value,
            };
        case 'BooleanValue':
            return {
                kind: 'BooleanValue',
                value: valueNode.value,
            };
        case 'EnumValue':
            return {
                kind: 'EnumValue',
                value: valueNode.value,
            };
        case 'NullValue':
            return {
                kind: 'NullValue',
            };
        case 'ListValue': {
            const values = valueNode.values.map(value => {
                return getArgumentValue(value);
            });

            return {
                kind: 'ListValue',
                values: values,
            };
        }
        case 'ObjectValue': {
            const { fields } = valueNode;
            const result: { [name: string]: LuvioValueNode } = {};
            fields.forEach(field => {
                const name = field.name.value;
                result[name] = getArgumentValue(field.value);
            });

            return {
                kind: 'ObjectValue',
                fields: result,
            };
        }
        default:
            throw new Error('Unsupported type');
    }
}

export function fieldVisitor(ast: ASTNode): LuvioDocumentNode {
    const variableDeclarations: VariableDefinitionNode[] = [];

    const queryRoot: LuvioFieldNode = {
        kind: 'ObjectFieldSelection',
        name: 'query',
        luvioSelections: [],
    };
    const currentNodePath: Array<LuvioFieldNode> = [queryRoot];

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
                    }
                }

                if (selectionNode.kind !== 'ScalarFieldSelection') {
                    if (fieldArgs !== undefined && fieldArgs.length > 0) {
                        const args: LuvioArgumentNode[] = [];
                        copyArguments(fieldArgs, args);
                        selectionNode.arguments = args;
                    }
                }

                const parentNode = currentNodePath[currentNodePath.length - 1];
                if (
                    parentNode.kind === 'ObjectFieldSelection' ||
                    parentNode.kind === 'CustomFieldSelection'
                ) {
                    parentNode.luvioSelections!.push(selectionNode);
                }

                currentNodePath.push(selectionNode);
            }
        },
        leave(node, _key, _parent, _path, _ancestors) {
            if (node.kind === 'Field') {
                currentNodePath.pop();
            }
        },
    });

    const operationDefinition: LuvioOperationDefinitionNode = {
        kind: 'OperationDefinition',
        operation: 'query',
        variableDefinitions: variableDeclarations,
        name: 'operationName',
        luvioSelections: queryRoot.luvioSelections!,
    };

    const root: LuvioDocumentNode = {
        kind: 'Document',
        definitions: [operationDefinition],
    };

    return root;
}
