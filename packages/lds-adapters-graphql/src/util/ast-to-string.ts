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
import { ObjectKeys } from './language';

const KIND_OBJECT_FIELD_SELECTION = 'ObjectFieldSelection';
const TYPENAME_FIELD = '__typename';

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

function serializeObjectFieldNodeUnderRecord(node: LuvioSelectionObjectFieldNode): string {
    const { luvioSelections, arguments: nodeArgs, name: nodeName } = node;
    const fields: Record<string, true> = {};
    let result = ``;

    if (luvioSelections === undefined) {
        // eslint-disable-next-line @salesforce/lds/no-error-in-production
        throw new Error('selection should not be empty for ObjectFieldNodeUnderRecord');
    }

    const luvioSelectionsLength = luvioSelections.length;
    for (let i = 0; i < luvioSelectionsLength; i++) {
        const sel = getLuvioFieldNodeSelection(luvioSelections[i]);
        const { name } = sel;
        if (sel.kind !== 'ScalarFieldSelection') {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error(
                    `Invalid selection for ${nodeName}. ${nodeName} appears to be a Record, but is missing @resource(type: "Record")`
                );
            }
        }

        if (RECORD_DEFAULT_FIELD_VALUES.indexOf(name) === -1) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error(
                    `Invalid selection for "${nodeName}.${name}". Only ${RECORD_DEFAULT_FIELD_VALUES.join(
                        ', '
                    )} are supported. If "${nodeName}" is a spanning Record, please include @resource(type: "Record") directive.`
                );
            }
        }

        fields[name] = true;
        result = `${result}${serializeScalarFieldNode(sel as LuvioSelectionScalarFieldNode)}`;
    }

    result = appendRecordDefaultFieldValues(result, fields);
    const args = nodeArgs === undefined ? '' : `(${serializeArguments(nodeArgs)})`;
    return `${serializeFieldNodeName(node)}${args} { ${TYPENAME_FIELD} ${result} }`;
}

function isLuvioFieldNodeObjectFieldNode(
    node: LuvioFieldNode
): node is LuvioSelectionObjectFieldNode {
    return node.kind === KIND_OBJECT_FIELD_SELECTION;
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
        const { name } = sel;
        fields[name] = true;
        const def = isLuvioFieldNodeObjectFieldNode(sel)
            ? serializeObjectFieldNodeUnderRecord(sel)
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

    if (process.env.NODE_ENV !== 'production') {
        throw new Error(`Unable to serialize graphql query, unsupported field node "${kind}"`);
    }
}

function serializeScalarFieldNode(def: LuvioSelectionScalarFieldNode) {
    return `${serializeFieldNodeName(def)}, `;
}

function serializeObjectFieldNode(def: LuvioSelectionObjectFieldNode, state: SerializeState) {
    const { luvioSelections, arguments: defArgs } = def;
    const args = defArgs === undefined ? '' : `(${serializeArguments(defArgs)})`;
    return `${serializeFieldNodeName(def)}${args} { ${TYPENAME_FIELD} ${serializeSelections(
        luvioSelections,
        state
    )} }`;
}

function serializeCustomFieldConnection(def: LuvioSelectionCustomFieldNode, state: SerializeState) {
    const { luvioSelections, arguments: args } = def;
    const argsString =
        args === undefined || args.length === 0 ? '' : `(${serializeArguments(args)})`;

    return `${serializeFieldNodeName(def)}${argsString} { ${TYPENAME_FIELD} ${serializeSelections(
        luvioSelections,
        state
    )} }`;
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

    if (process.env.NODE_ENV !== 'production') {
        throw new Error(
            `Unable to serialize graphql query, unsupported CustomField type "${type}"`
        );
    }
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
