import { LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import {
    BooleanValueNode,
    FloatValueNode,
    IntValueNode,
    StringValueNode,
    LuvioDefinitionNode,
    LuvioObjectValueNode,
    LuvioOperationDefinitionNode,
    LuvioValueNode,
    LuvioVariableNode,
    LuvioVariableDefinitionNode,
    LuvioNamedTypeNode,
    LuvioListTypeNode,
    LuvioListValueNode,
    LuvioTypeNode,
} from '@salesforce/lds-graphql-parser';
import { SerializeState, TYPENAME_FIELD, serializeSelections } from './serialize';
import { ObjectKeys } from './language';

export function serializeValueNode(valueDefinition: LuvioValueNode) {
    const { kind } = valueDefinition;
    switch (kind) {
        case 'ObjectValue':
            return serializeObjectValueNode(valueDefinition as LuvioObjectValueNode);
        case 'StringValue':
            return serializeStringValueNode(valueDefinition as StringValueNode);
        case 'NullValue':
            return 'null';
        case 'FloatValue':
        case 'IntValue':
        case 'BooleanValue':
            return (valueDefinition as BooleanValueNode).value;
        case 'Variable':
            return serializeVariableNode(valueDefinition as LuvioVariableNode);
        case 'ListValue':
            return serializeListValueNode(valueDefinition as LuvioListValueNode);
        case 'EnumValue':
            return (
                valueDefinition as
                    | BooleanValueNode
                    | FloatValueNode
                    | IntValueNode
                    | BooleanValueNode
            ).value;
    }

    if (process.env.NODE_ENV !== 'production') {
        throw new Error(`Unable to serialize graphql query, unsupported value node "${kind}"`);
    }
}

function serializeVariableNode(variableNode: LuvioVariableNode) {
    return `$${variableNode.name}`;
}

function serializeListValueNode(listNode: LuvioListValueNode) {
    const { values } = listNode;
    if (values.length === 0) {
        return '';
    }
    let str = '';
    for (let i = 0, len = values.length; i < len; i += 1) {
        str = `${str}${serializeValueNode(values[i])}, `;
    }
    return `[${str.substring(0, str.length - 2)}]`;
}

function serializeStringValueNode(literalValueNode: StringValueNode) {
    return `"${literalValueNode.value}"`;
}

export function serializeObjectValueNode(objectValueDefinition: LuvioObjectValueNode): string {
    const { fields } = objectValueDefinition;
    let str = [];
    const fieldKeys = ObjectKeys(fields);
    for (let i = 0, len = fieldKeys.length; i < len; i += 1) {
        const fieldKey = fieldKeys[i];
        str.push(`${fieldKey}: ${serializeValueNode(fields[fieldKey])}`);
    }
    return `{ ${str.join(', ')} }`;
}

function serializeVariableDefinitions(definitons: LuvioVariableDefinitionNode[] | undefined) {
    if (definitons === undefined || definitons.length === 0) {
        return '';
    }
    let str = '';
    for (let i = 0, len = definitons.length; i < len; i += 1) {
        const def = serializeVariableDefinitionNode(definitons[i]);
        str = `${str}${def}, `;
    }
    return ` (${str.substring(0, str.length - 2)})`;
}

function serializeVariableDefinitionNode(def: LuvioVariableDefinitionNode) {
    const { variable, type, defaultValue } = def;
    return defaultValue === undefined
        ? `$${variable.name}: ${serializeTypeNode(type)}`
        : `$${variable.name}: ${serializeTypeNode(type)} = ${serializeValueNode(defaultValue)}`;
}

function serializeTypeNode(type: LuvioTypeNode): string {
    const { kind } = type;

    switch (kind) {
        case 'NamedType':
            return serializeNamedTypeNode(type as LuvioNamedTypeNode);
        case 'ListType':
            return serializeListTypeNode(type as LuvioListTypeNode);
    }
    if (process.env.NODE_ENV !== 'production') {
        throw new Error(
            `Unable to serialize graphql query, unsupported variable definition type node "${type.kind}"`
        );
    }
    return '';
}

function serializeNamedTypeNode(type: LuvioNamedTypeNode) {
    return type.name;
}

function serializeListTypeNode(type: LuvioListTypeNode) {
    return `[${serializeTypeNode(type.type)}]`;
}

function serializeOperationNode(def: LuvioDefinitionNode, state: SerializeState) {
    const { kind } = def;
    switch (kind) {
        case 'OperationDefinition':
            return serializeOperationDefinition(def as LuvioOperationDefinitionNode, state);
    }

    if (process.env.NODE_ENV !== 'production') {
        throw new Error(
            `Unable to serialize graphql query, unsupported OperationDefinition type "${kind}"`
        );
    }
}

export function serializeOperationDefinition(
    def: LuvioOperationDefinitionNode,
    state: SerializeState
) {
    const { operation, luvioSelections, name, variableDefinitions } = def;
    const nameStr = name === undefined ? ' ' : ` ${name} `;
    return `${operation}${nameStr}${serializeVariableDefinitions(
        variableDefinitions
    )}{ ${TYPENAME_FIELD} ${serializeSelections(luvioSelections, state)} }`;
}

function applyFragments(str: string, fragments: SerializeState['fragments']) {
    let appliedString = str;
    const fragmentNames = Object.keys(fragments);
    for (let i = 0, len = fragmentNames.length; i < len; i += 1) {
        const name = fragmentNames[i];
        appliedString = `${appliedString} ${fragments[name]}`;
    }

    return appliedString;
}

export function astToString(ast: LuvioDocumentNode) {
    const { definitions } = ast;
    const state: SerializeState = {
        fragments: {},
    };
    let str = '';
    for (let i = 0, len = definitions.length; i < len; i += 1) {
        const def = serializeOperationNode(definitions[i], state);
        str = `${str}${def}`;
    }
    return applyFragments(str, state.fragments);
}
