import {
    ArgumentNode,
    ASTNode,
    DirectiveNode,
    StringValueNode,
    ValueNode,
    visit,
} from 'graphql/language';
import { LuvioDocumentNode, LuvioOperationDefinitionNode } from './ast';

function copyArguments(argNodes: readonly ArgumentNode[], target: any[]) {
    for (let i = 0; i < argNodes.length; i++) {
        const argNode = argNodes[i];
        const arg = {
            kind: 'Argument',
            name: argNode.name.value,
            value: getArgumentValue(argNode.value),
        };

        target.push(arg);
    }
}

function getArgumentValue(valueNode: ValueNode): any {
    switch (valueNode.kind) {
        case 'Variable':
            return {
                kind: 'Variable',
                name: valueNode.name.value,
            };
        case 'IntValue':
        case 'FloatValue':
            return {
                kind: 'LiteralValue',
                type: 'number',
                value: valueNode.value,
            };
        case 'StringValue':
            return {
                kind: 'LiteralValue',
                type: 'string',
                value: valueNode.value,
            };
        case 'BooleanValue':
            return {
                kind: 'LiteralValue',
                type: 'string',
                value: valueNode.value,
            };
        case 'EnumValue':
            return {
                kind: 'LiteralValue',
                type: 'enum',
                value: valueNode.value,
            };
        case 'NullValue':
            return {
                kind: 'LiteralValue',
                type: 'null',
                value: null,
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
            const result: { [name: string]: any } = {};
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
    const variableDeclarations: any[] = [];

    const queryRoot = {
        kind: 'ObjectField',
        name: 'query',
        selections: [] as any[],
    };
    const currentNodePath = [queryRoot];

    visit(ast, {
        enter(node, _key, _parent, _path, _ancestors) {
            if (node.kind === 'Field') {
                const { name, arguments: fieldArgs, selectionSet, directives } = node;

                let selectionNode: any = undefined;
                if (selectionSet === undefined || selectionSet.selections.length === 0) {
                    selectionNode = {
                        kind: 'ScalarField',
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
                            kind: 'CustomField',
                            name: name.value,
                            type: 'Connection',
                            selections: [],
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
                            kind: 'CustomField',
                            name: name.value,
                            type: (resourceDirective!.arguments![0].value as StringValueNode).value,
                            selections: [],
                        };
                    }
                }

                if (selectionNode === undefined) {
                    selectionNode = {
                        kind: 'ObjectField',
                        name: name.value,
                        selections: [],
                    };
                }

                if (selectionNode.kind !== 'ScalarField') {
                    if (fieldArgs !== undefined && fieldArgs.length > 0) {
                        const args: any[] = [];
                        copyArguments(fieldArgs, args);
                        selectionNode.args = args;
                    }
                }

                const parentNode = currentNodePath[currentNodePath.length - 1];
                if (parentNode.kind === 'ObjectField' || parentNode.kind === 'CustomField') {
                    parentNode.selections.push(selectionNode);
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
        name: { kind: 'Name', value: 'operationName' },
        selections: queryRoot.selections,
    };

    const root: LuvioDocumentNode = {
        kind: 'Document',
        definitions: [operationDefinition],
    };

    return root;
}
