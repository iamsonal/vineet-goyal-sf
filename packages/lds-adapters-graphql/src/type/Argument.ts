import {
    LuvioArgumentNode,
    LuvioListValueNode,
    LuvioObjectValueNode,
    LuvioValueNode,
    LuvioVariableNode,
} from '@salesforce/lds-graphql-parser';
import { serializeValueNode } from '../util/ast-to-string';
import { ObjectKeys } from '../util/language';
import { sortAndCopyUsingObjectKey } from '../util/sortUsingKey';
import { GraphQLVariables } from './Variable';
import { stableJSONStringify } from '../util/adapter';

export type SerializationOptions =
    | {
          render: true;
          variables: GraphQLVariables;
      }
    | {
          render: false;
      };

export function serialize(args: LuvioArgumentNode[]): string {
    return serializeArgs(args, { render: false });
}

export function render(args: LuvioArgumentNode[], variables: GraphQLVariables): string {
    return serializeArgs(args, { render: true, variables });
}

function serializeArgs(args: LuvioArgumentNode[], option: SerializationOptions): string {
    const sortedArgs = option.render === true ? sortAndCopyUsingObjectKey(args, 'name') : args;

    let str = '';
    for (let i = 0, len = sortedArgs.length; i < len; i += 1) {
        str = `${str}${serializeArgumentNode(sortedArgs[i], option)}`;
        if (len > 1 && i < len - 1) {
            str = `${str},`;
        }
    }

    return str;
}

function serializeArgumentValueNode(valueDefinition: LuvioValueNode, option: SerializationOptions) {
    const { kind } = valueDefinition;
    switch (kind) {
        case 'ObjectValue':
            return serializeAndSortObjectValueNode(valueDefinition as LuvioObjectValueNode, option);
        case 'ListValue':
            return serializeAndSortListValueNode(valueDefinition as LuvioListValueNode, option);
        case 'Variable':
            return serializeVariableNode(valueDefinition as LuvioVariableNode, option);
        default:
            return serializeValueNode(valueDefinition);
    }
}

function serializeVariableNode(literalValueNode: LuvioVariableNode, option: SerializationOptions) {
    if (option.render === false) {
        return `$${literalValueNode.name}`;
    }
    return `${serializeVariableValue(option.variables[literalValueNode.name])}`;
}

function serializeVariableValue(value: unknown): string {
    return stableJSONStringify(value);
}

function serializeAndSortListValueNode(
    objectValueDefinition: LuvioListValueNode,
    option: SerializationOptions
): string {
    const { values } = objectValueDefinition;
    const str = [];
    const sorted = option.render === true ? sortAndCopyUsingObjectKey(values, 'value') : values;
    for (let i = 0, len = sorted.length; i < len; i += 1) {
        str.push(serializeArgumentValueNode(sorted[i], option));
    }
    return `[${str.join(',')}]`;
}

function serializeAndSortObjectValueNode(
    objectValueDefinition: LuvioObjectValueNode,
    option: SerializationOptions
) {
    const { fields } = objectValueDefinition;
    let str = '';
    const fieldKeys = ObjectKeys(fields).sort();
    for (let i = 0, len = fieldKeys.length; i < len; i += 1) {
        const fieldKey = fieldKeys[i];
        str = `${str}${fieldKey}:${serializeArgumentValueNode(fields[fieldKey], option)}`;
        if (len > 1 && i < len - 1) {
            str = `${str},`;
        }
    }
    return `{${str}}`;
}

function serializeArgumentNode(arg: LuvioArgumentNode, option: SerializationOptions): string {
    const { name, value } = arg;
    return `${name}:${serializeArgumentValueNode(value, option)}`;
}
