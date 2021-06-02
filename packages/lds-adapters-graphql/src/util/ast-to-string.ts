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
} from '@salesforce/lds-graphql-parser';
import {
    defaultRecordFieldsFragmentName,
    defaultRecordFieldsFragment,
    RECORD_DEFAULT_FIELD_VALUES,
} from '../custom/record';
import { getLuvioFieldNodeSelection } from '../type/Selection';

const { keys } = Object;
const KIND_OBJECT_FIELD_SELECTION = 'ObjectFieldSelection';

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
    return `${serializeFieldNodeName(def)}(${serializeArguments(args)}) { ${serializeSelections(
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

function serializeOperationDefinition(def: LuvioOperationDefinitionNode, state: SerializeState) {
    const { operation, luvioSelections } = def;
    return `${operation} { ${serializeSelections(luvioSelections, state)} }`;
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
