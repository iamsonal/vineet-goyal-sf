import { FieldNode, StringValueNode } from 'graphql/language';
import { transform as transformArgumentNode } from './argument-node';
import { LuvioArgumentNode, LuvioFieldNode } from './ast';
import {
    CUSTOM_DIRECTIVE_CONNECTION,
    CUSTOM_DIRECTIVE_RESOURCE,
    NODE_KIND_CUSTOM_FIELD_SELECTION,
    NODE_KIND_OBJECT_FIELD_SELECTION,
    NODE_KIND_SCALAR_FIELD_SELECTION,
    NODE_TYPE_CONNECTION,
} from './constants';
import { isCustomDirective, transform as transformDirectiveNode } from './directive-node';
import { TransformState } from './operation/query';

export function transform(node: FieldNode, transformState: TransformState): LuvioFieldNode {
    const { name, alias, arguments: fieldArgs, selectionSet, directives } = node;

    let luvioNode: LuvioFieldNode = {
        kind: NODE_KIND_OBJECT_FIELD_SELECTION,
        name: name.value,
        luvioSelections: [],
    };

    if (selectionSet === undefined || selectionSet.selections.length === 0) {
        luvioNode = {
            kind: NODE_KIND_SCALAR_FIELD_SELECTION,
            name: name.value,
        };
    } else {
        // object or custom field node
        if (directives !== undefined && directives.length > 0) {
            const customDirectiveNode = directives.find(isCustomDirective);
            if (customDirectiveNode === undefined) {
                // transform non client-side directives
                luvioNode.directives = directives.map((directive) =>
                    transformDirectiveNode(directive, transformState)
                );
            } else {
                if (customDirectiveNode.name.value === CUSTOM_DIRECTIVE_CONNECTION) {
                    luvioNode = {
                        kind: NODE_KIND_CUSTOM_FIELD_SELECTION,
                        name: name.value,
                        type: NODE_TYPE_CONNECTION,
                        luvioSelections: [],
                    };
                } else if (customDirectiveNode.name.value === CUSTOM_DIRECTIVE_RESOURCE) {
                    luvioNode = {
                        kind: NODE_KIND_CUSTOM_FIELD_SELECTION,
                        name: name.value,
                        type: (customDirectiveNode!.arguments![0].value as StringValueNode).value,
                        luvioSelections: [],
                    };
                }
            }
        }

        if (fieldArgs !== undefined && fieldArgs.length > 0) {
            const returnArguments: LuvioArgumentNode[] = [];
            for (var index = 0; index < fieldArgs.length; index++) {
                const value = transformArgumentNode(fieldArgs[index], transformState);
                returnArguments.push(value);
            }
            luvioNode.arguments = returnArguments;
        }
    }

    if (alias !== undefined) {
        luvioNode.alias = alias.value;
    }

    return luvioNode;
}
