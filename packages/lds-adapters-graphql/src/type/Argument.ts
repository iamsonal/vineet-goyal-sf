import {
    BooleanValueNode,
    FloatValueNode,
    IntValueNode,
    LuvioArgumentNode,
    LuvioFieldNode,
    LuvioObjectValueNode,
    LuvioValueNode,
    StringValueNode,
} from '@salesforce/lds-graphql-parser';
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

function serializeValueNode(valueDefinition: LuvioValueNode): string {
    const { kind } = valueDefinition;
    switch (kind) {
        case 'ObjectValue':
            return serializeAndSortObjectValueNode(valueDefinition as LuvioObjectValueNode);
        case 'StringValue':
            return serializeStringValueNode(valueDefinition as StringValueNode);
        case 'NullValue':
            return 'null';
        case 'FloatValue':
            return (valueDefinition as FloatValueNode).value;
        case 'IntValue':
            return (valueDefinition as IntValueNode).value;
        case 'BooleanValue':
        case 'EnumValue':
            return `${(valueDefinition as BooleanValueNode).value}`;
    }

    throw new Error(`Unable to serialize graphql query, unsupported value node "${kind}"`);
}

function serializeStringValueNode(literalValueNode: StringValueNode) {
    return `"${literalValueNode.value}"`;
}

function serializeAndSortObjectValueNode(objectValueDefinition: LuvioObjectValueNode) {
    const { fields } = objectValueDefinition;
    let str = '';
    const fieldKeys = keys(fields).sort();
    for (let i = 0, len = fieldKeys.length; i < len; i += 1) {
        const fieldKey = fieldKeys[i];
        str = `${str}${fieldKey}:${serializeValueNode(fields[fieldKey])}`;
        if (len > 1 && i < len - 1) {
            str = `${str},`;
        }
    }
    return `{${str}}`;
}

export function serialize(arg: LuvioArgumentNode): string {
    const { name, value } = arg;
    return `${name}:${serializeValueNode(value)}`;
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
