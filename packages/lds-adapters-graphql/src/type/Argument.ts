import {
    LuvioArgumentNode,
    LuvioFieldNode,
    LuvioListValueNode,
    LuvioObjectValueNode,
    LuvioValueNode,
} from '@salesforce/lds-graphql-parser';
import { serializeValueNode } from '../util/ast-to-string';
import { sortAndCopyUsingObjectKey } from '../util/sortUsingKey';

const { keys } = Object;

export function resolveIngestedPropertyName(sel: LuvioFieldNode) {
    const { name: fieldName } = sel;
    if (sel.kind === 'ScalarFieldSelection') {
        return fieldName;
    }

    const { arguments: selectionArguments } = sel;
    if (selectionArguments === undefined || selectionArguments.length === 0) {
        return fieldName;
    }

    return `${fieldName}(${serializeAndSortArguments(selectionArguments)})`;
}

function serializeArgumentValueNode(valueDefinition: LuvioValueNode) {
    const { kind } = valueDefinition;
    switch (kind) {
        case 'ObjectValue':
            return serializeAndSortObjectValueNode(valueDefinition as LuvioObjectValueNode);
        case 'ListValue':
            return serializeAndSortListValueNode(valueDefinition as LuvioListValueNode);
        default:
            return serializeValueNode(valueDefinition);
    }
}

function serializeAndSortListValueNode(objectValueDefinition: LuvioListValueNode): string {
    const { values } = objectValueDefinition;
    const str = [];
    const sorted = sortAndCopyUsingObjectKey(values, 'value');
    for (let i = 0, len = sorted.length; i < len; i += 1) {
        str.push(serializeArgumentValueNode(sorted[i]));
    }
    return `[${str.join(',')}]`;
}

function serializeAndSortObjectValueNode(objectValueDefinition: LuvioObjectValueNode) {
    const { fields } = objectValueDefinition;
    let str = '';
    const fieldKeys = keys(fields).sort();
    for (let i = 0, len = fieldKeys.length; i < len; i += 1) {
        const fieldKey = fieldKeys[i];
        str = `${str}${fieldKey}:${serializeArgumentValueNode(fields[fieldKey])}`;
        if (len > 1 && i < len - 1) {
            str = `${str},`;
        }
    }
    return `{${str}}`;
}

export function serialize(arg: LuvioArgumentNode): string {
    const { name, value } = arg;
    return `${name}:${serializeArgumentValueNode(value)}`;
}

export function serializeAndSortArguments(args: LuvioArgumentNode[]): string {
    const sortedArgs = sortAndCopyUsingObjectKey(args, 'name');
    let str = '';
    for (let i = 0, len = sortedArgs.length; i < len; i += 1) {
        str = `${str}${serialize(sortedArgs[i])}`;
        if (len > 1 && i < len - 1) {
            str = `${str},`;
        }
    }
    return str;
}
