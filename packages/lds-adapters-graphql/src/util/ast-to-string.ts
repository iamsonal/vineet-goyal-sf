import { LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import {
    BooleanValueNode,
    FloatValueNode,
    IntValueNode,
    StringValueNode,
    LuvioArgumentNode,
    LuvioDefinitionNode,
    LuvioObjectValueNode,
    LuvioOperationDefinitionNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
    LuvioSelectionScalarFieldNode,
    LuvioValueNode,
    LuvioFieldNode,
    LuvioVariableNode,
    LuvioVariableDefinitionNode,
    LuvioNamedTypeNode,
    LuvioListTypeNode,
    LuvioListValueNode,
    LuvioTypeNode,
} from '@salesforce/lds-graphql-parser';
import {
    defaultRecordFieldsFragmentName,
    defaultRecordFieldsFragment,
    RECORD_DEFAULT_FIELD_VALUES,
} from '../custom/record';
import { getLuvioFieldNodeSelection } from '../type/Selection';

const { keys } = Object;
const KIND_OBJECT_FIELD_SELECTION = 'ObjectFieldSelection';

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

    throw new Error(`Unable to serialize graphql query, unsupported value node "${kind}"`);
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
    const fieldKeys = keys(fields);
    for (let i = 0, len = fieldKeys.length; i < len; i += 1) {
        const fieldKey = fieldKeys[i];
        str.push(`${fieldKey}: ${serializeValueNode(fields[fieldKey])}`);
    }
    return `{ ${str.join(', ')} }`;
}

export function serializeArguments(argDefinitions: LuvioArgumentNode[] | undefined) {
    if (argDefinitions === undefined) {
        return '';
    }

    let str = '';
    for (let i = 0, len = argDefinitions.length; i < len; i += 1) {
        let def = serializeArgument(argDefinitions[i]);
        if (i !== 0) {
            def = ` ${def}`;
        }
        str = `${str}${def}`;
    }
    return str;
}

function serializeArgument(argDefinition: LuvioArgumentNode) {
    const { name, value } = argDefinition;
    return `${name}: ${serializeValueNode(value)}`;
}

function serializeFieldNodeName(node: LuvioFieldNode): string {
    const { name, alias } = node;
    return alias === undefined ? `${name}` : `${alias}: ${name}`;
}

function serializeSelections(selections: LuvioSelectionNode[] | undefined, state: SerializeState) {
    if (selections === undefined) {
        return '';
    }
    let str = '';
    for (let i = 0, len = selections.length; i < len; i += 1) {
        const def = serializeFieldNode(selections[i], state);
        str = `${str}${def}`;
    }

    return str;
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
    throw new Error(
        `Unable to serialize graphql query, unsupported variable definition type node "${type.kind}"`
    );
}

function serializeNamedTypeNode(type: LuvioNamedTypeNode) {
    return type.name;
}

function serializeListTypeNode(type: LuvioListTypeNode) {
    return `[${serializeTypeNode(type.type)}]`;
}

function serializeRecordSelections(
    selections: LuvioSelectionNode[] | undefined,
    state: SerializeState
) {
    if (selections === undefined) {
        return '';
    }
    let str = '';
    const fields: Record<string, true> = {};
    for (let i = 0, len = selections.length; i < len; i += 1) {
        const sel = getLuvioFieldNodeSelection(selections[i]);
        const { name, kind } = sel;
        fields[name] = true;
        // We are assuming that any ObjectFieldSelection in Record implements FieldValue type
        const def =
            kind === KIND_OBJECT_FIELD_SELECTION
                ? serializeRecordFieldValue(sel as LuvioSelectionObjectFieldNode)
                : serializeFieldNode(sel, state);
        str = `${str}${def}`;
    }

    return str;
}

function serializeFieldNode(def: LuvioSelectionNode, state: SerializeState) {
    const { kind } = def;
    switch (kind) {
        case 'ObjectFieldSelection':
            return serializeObjectFieldNode(def as LuvioSelectionObjectFieldNode, state);
        case 'CustomFieldSelection':
            return serializeCustomFieldNode(def as LuvioSelectionCustomFieldNode, state);
        case 'ScalarFieldSelection':
            return serializeScalarFieldNode(def as LuvioSelectionScalarFieldNode);
    }

    throw new Error(`Unable to serialize graphql query, unsupported field node "${kind}"`);
}

function serializeScalarFieldNode(def: LuvioSelectionScalarFieldNode) {
    return `${serializeFieldNodeName(def)}, `;
}

function serializeObjectFieldNode(def: LuvioSelectionObjectFieldNode, state: SerializeState) {
    const { luvioSelections, arguments: defArgs } = def;
    const args = defArgs === undefined ? '' : `(${serializeArguments(defArgs)})`;
    return `${serializeFieldNodeName(def)}${args} { ${serializeSelections(
        luvioSelections,
        state
    )} }`;
}

function serializeCustomFieldConnection(def: LuvioSelectionCustomFieldNode, state: SerializeState) {
    const { luvioSelections, arguments: args } = def;
    const argsString =
        args === undefined || args.length === 0 ? '' : `(${serializeArguments(args)})`;

    return `${serializeFieldNodeName(def)}${argsString} { ${serializeSelections(
        luvioSelections,
        state
    )} }`;
}

function getLuvioSelections(
    luvioSelections: LuvioSelectionNode[] | undefined
): LuvioSelectionNode[] {
    return luvioSelections === undefined ? [] : luvioSelections;
}

function appendRecordDefaultFieldValues(
    fieldValues: string,
    fieldValuesMap: Record<string, true>
): string {
    let str = fieldValues;
    for (let i = 0, len = RECORD_DEFAULT_FIELD_VALUES.length; i < len; i++) {
        const defaultField = RECORD_DEFAULT_FIELD_VALUES[i];

        if (fieldValuesMap[defaultField] !== true) {
            str = `${str}${defaultField}, `;
        }
    }
    return str;
}

function serializeRecordFieldValue(def: LuvioSelectionObjectFieldNode): string {
    const { luvioSelections, arguments: defArgs } = def;
    const args = defArgs === undefined ? '' : `(${serializeArguments(defArgs)})`;
    const fields: Record<string, true> = {};
    const selections = getLuvioSelections(luvioSelections);

    let str = ``;
    for (let i = 0, len = selections.length; i < len; i++) {
        const sel = getLuvioFieldNodeSelection(selections[i]);
        fields[sel.name] = true;
        str = `${str}${serializeScalarFieldNode(sel as LuvioSelectionScalarFieldNode)}`;
    }
    return `${serializeFieldNodeName(def)}${args} { ${appendRecordDefaultFieldValues(
        str,
        fields
    )} }`;
}

export function serializeCustomFieldRecord(
    def: LuvioSelectionCustomFieldNode,
    state: SerializeState
) {
    const { luvioSelections } = def;
    if (state.fragments[defaultRecordFieldsFragmentName] === undefined) {
        state.fragments[defaultRecordFieldsFragmentName] = defaultRecordFieldsFragment;
    }
    return `${serializeFieldNodeName(def)} { ${serializeRecordSelections(
        luvioSelections,
        state
    )} ...${defaultRecordFieldsFragmentName} }`;
}

function serializeCustomFieldNode(def: LuvioSelectionCustomFieldNode, state: SerializeState) {
    const { type } = def;

    switch (type) {
        case 'Connection':
            return serializeCustomFieldConnection(def, state);
        case 'Record':
            return serializeCustomFieldRecord(def, state);
    }

    throw new Error(`Unable to serialize graphql query, unsupported CustomField type "${type}"`);
}

function serializeOperationNode(def: LuvioDefinitionNode, state: SerializeState) {
    const { kind } = def;
    switch (kind) {
        case 'OperationDefinition':
            return serializeOperationDefinition(def as LuvioOperationDefinitionNode, state);
    }

    throw new Error(
        `Unable to serialize graphql query, unsupported OperationDefinition type "${kind}"`
    );
}

export function serializeOperationDefinition(
    def: LuvioOperationDefinitionNode,
    state: SerializeState
) {
    const { operation, luvioSelections, name, variableDefinitions } = def;
    const nameStr = name === undefined ? ' ' : ` ${name} `;
    return `${operation}${nameStr}${serializeVariableDefinitions(
        variableDefinitions
    )}{ ${serializeSelections(luvioSelections, state)} }`;
}

interface SerializeState {
    fragments: Record<string, string>;
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
