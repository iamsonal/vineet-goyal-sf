import {
    LuvioArgumentNode,
    LuvioFieldNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
    LuvioSelectionScalarFieldNode,
} from '@salesforce/lds-graphql-parser';
import { getLuvioFieldNodeSelection } from '../type/Selection';
import { serialize as serializeCustomFieldConnection } from '../custom/connection';
import {
    defaultRecordFieldsFragment,
    defaultRecordFieldsFragmentName,
    RECORD_DEFAULT_FIELD_VALUES,
} from '../custom/record';
import { serializeValueNode } from './ast-to-string';

export const TYPENAME_FIELD = '__typename';

const KIND_OBJECT_FIELD_SELECTION = 'ObjectFieldSelection';

export interface SerializeState {
    fragments: Record<string, string>;
}

export function serializeFieldNodeName(node: LuvioFieldNode): string {
    const { name, alias } = node;
    return alias === undefined ? `${name}` : `${alias}: ${name}`;
}

export function serializeSelections(
    selections: LuvioSelectionNode[] | undefined,
    state: SerializeState
) {
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

export function serializeFieldNode(def: LuvioSelectionNode, state: SerializeState): string {
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
    return '';
}

function serializeObjectFieldNode(def: LuvioSelectionObjectFieldNode, state: SerializeState) {
    const { luvioSelections, arguments: defArgs } = def;
    const args = defArgs === undefined ? '' : `(${serializeArguments(defArgs)})`;
    return `${serializeFieldNodeName(def)}${args} { ${TYPENAME_FIELD} ${serializeSelections(
        luvioSelections,
        state
    )} }`;
}

function serializeCustomFieldNode(
    def: LuvioSelectionCustomFieldNode,
    state: SerializeState
): string {
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
    return '';
}

function serializeScalarFieldNode(def: LuvioSelectionScalarFieldNode) {
    return `${serializeFieldNodeName(def)}, `;
}

export function serializeRecordSelections(
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

export function isLuvioFieldNodeObjectFieldNode(
    node: LuvioFieldNode
): node is LuvioSelectionObjectFieldNode {
    return node.kind === KIND_OBJECT_FIELD_SELECTION;
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
