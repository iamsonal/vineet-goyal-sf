import { LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import {
    LuvioArgumentNode,
    LuvioDefinitionNode,
    LuvioObjectValueNode,
    LuvioOperationDefinitionNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
    LuvioSelectionScalarFieldNode,
    LuvioValueNode,
} from '@salesforce/lds-graphql-parser/dist/ast';
import { BooleanValueNode, FloatValueNode, IntValueNode, StringValueNode } from 'graphql/language';

const { keys } = Object;

function serializeValueNode(valueDefinition: LuvioValueNode) {
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
            return (valueDefinition as BooleanValueNode).value;
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
        str = `${str} { ${fieldKey}: ${serializeValueNode(fields[fieldKey])} }`;
    }
    return str;
}

function serializeArguments(argDefinitions: LuvioArgumentNode[] | undefined) {
    if (argDefinitions === undefined) {
        return '';
    }

    let str = '';
    for (let i = 0, len = argDefinitions.length; i < len; i += 1) {
        const def = serializeArgument(argDefinitions[i]);
        str = `${str}${def}`;
    }
    return str;
}

function serializeArgument(argDefinition: LuvioArgumentNode) {
    const { name, value } = argDefinition;
    return `${name}: ${serializeValueNode(value)}`;
}

function serializeSelections(selections: LuvioSelectionNode[] | undefined) {
    if (selections === undefined) {
        return '';
    }
    let str = '';
    for (let i = 0, len = selections.length; i < len; i += 1) {
        const def = serializeFieldNode(selections[i]);
        str = `${str}${def}`;
    }

    return str;
}

function serializeFieldNode(def: LuvioSelectionNode) {
    const { kind } = def;
    switch (kind) {
        case 'ObjectFieldSelection':
            return serializeObjectFieldNode(def as LuvioSelectionObjectFieldNode);
        case 'CustomFieldSelection':
            return serializeCustomFieldNode(def as LuvioSelectionCustomFieldNode);
        case 'ScalarFieldSelection':
            return serializeScalarFieldNode(def as LuvioSelectionScalarFieldNode);
    }

    throw new Error(`Unable to serialize graphql query, unsupported field node "${kind}"`);
}

function serializeScalarFieldNode(def: LuvioSelectionScalarFieldNode) {
    return `${def.name}, `;
}

function serializeObjectFieldNode(def: LuvioSelectionObjectFieldNode) {
    const { luvioSelections } = def;
    return `${def.name} { ${serializeSelections(luvioSelections)} }`;
}

function serializeCustomFieldConnection(def: LuvioSelectionCustomFieldNode) {
    const { name, luvioSelections, arguments: args } = def;
    return `${name}(${serializeArguments(args)}) { ${serializeSelections(luvioSelections)} }`;
}

function serializeCustomFieldRecord(def: LuvioSelectionCustomFieldNode) {
    const { name, luvioSelections } = def;
    return `${name} { ${serializeSelections(luvioSelections)} }`;
}

function serializeCustomFieldNode(def: LuvioSelectionCustomFieldNode) {
    const { type } = def;

    switch (type) {
        case 'Connection':
            return serializeCustomFieldConnection(def);
        case 'Record':
            return serializeCustomFieldRecord(def);
    }

    throw new Error(`Unable to serialize graphql query, unsupported CustomField type "${type}"`);
}

function serializeOperationNode(def: LuvioDefinitionNode) {
    const { kind } = def;
    switch (kind) {
        case 'OperationDefinition':
            return serializeOperationDefinition(def as LuvioOperationDefinitionNode);
    }

    throw new Error(
        `Unable to serialize graphql query, unsupported OperationDefinition type "${kind}"`
    );
}

function serializeOperationDefinition(def: LuvioOperationDefinitionNode) {
    const { operation, luvioSelections } = def;
    return `${operation} { ${serializeSelections(luvioSelections)} }`;
}

export function astToString(ast: LuvioDocumentNode) {
    const { definitions } = ast;
    let str = '';
    for (let i = 0, len = definitions.length; i < len; i += 1) {
        const def = serializeOperationNode(definitions[i]);
        str = `${str}${def}`;
    }

    return str;
}
