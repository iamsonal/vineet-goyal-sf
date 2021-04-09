import {
    BooleanValueNode,
    FloatValueNode,
    IntValueNode,
    LuvioArgumentNode,
    LuvioObjectValueNode,
    LuvioValueNode,
    StringValueNode,
} from '@salesforce/lds-graphql-parser';

const { keys } = Object;

function serializeValueNode(valueDefinition: LuvioValueNode): string {
    const { kind } = valueDefinition;
    switch (kind) {
        case 'ObjectValue':
            return serializeObjectValueNode(valueDefinition as LuvioObjectValueNode);
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

function serializeObjectValueNode(objectValueDefinition: LuvioObjectValueNode) {
    const { fields } = objectValueDefinition;
    let str = '';
    const fieldKeys = keys(fields);
    for (let i = 0, len = fieldKeys.length; i < len; i += 1) {
        const fieldKey = fieldKeys[i];
        str = `${str}{${fieldKey}:${serializeValueNode(fields[fieldKey])}}`;
        if (len > 1 && i < len - 1) {
            str = `${str},`;
        }
    }
    return str;
}

export function serialize(arg: LuvioArgumentNode): string {
    const { name, value } = arg;
    return `${name}:${serializeValueNode(value)}`;
}

export function serializeArguments(args: LuvioArgumentNode[]): string {
    let str = '';
    for (let i = 0, len = args.length; i < len; i += 1) {
        str = `${str}${serialize(args[i])}`;
        if (len > 1 && i < len - 1) {
            str = `${str},`;
        }
    }

    return str;
}
