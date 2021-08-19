import { PathSelection, LinkSelection, StoreLink } from '@luvio/engine';
import { FieldValueRepresentation } from '../generated/types/FieldValueRepresentation';
import {
    isSpanningRecord,
    buildSelectionFromRecord,
    createRecordSelection,
} from '../selectors/record';

import { ObjectKeys, ArrayPrototypePush } from '../util/language';
import { RecordFieldTrie } from '../util/records';

export type FieldMapRepresentationNormalized = {
    apiName: string;
    fields: {
        [key: string]: StoreLink;
    };
};
export type FieldMapRepresentation = {
    apiName: string;
    fields: {
        [key: string]: FieldValueRepresentation;
    };
};

export const MAX_RECORD_DEPTH = 5;
const FIELD_SEPARATOR = '.';

const SCALAR_VALUE_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'value',
};

const DISPLAY_VALUE_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'displayValue',
};

const FIELDS_SELECTION: PathSelection = {
    kind: 'Object',
    name: 'fields',
};

export function convertRecordFieldsArrayToTrie(
    fields: string[],
    optionalFields: string[] = []
): RecordFieldTrie {
    const root: RecordFieldTrie = {
        name: '<root>',
        optional: false,
        scalar: false,
        children: {},
    };

    insertFieldsIntoTrie(root, fields, false);
    insertFieldsIntoTrie(root, optionalFields, true);
    return root;
}

export function createPathSelection(
    propertyName: string,
    fieldDefinition: RecordFieldTrie
): PathSelection {
    const fieldsSelection: PathSelection[] = [];

    const { children } = fieldDefinition;
    const childrenKeys = ObjectKeys(children);
    for (let i = 0, len = childrenKeys.length; i < len; i += 1) {
        const childKey = childrenKeys[i];
        const childFieldDefinition = children[childKey];

        let fieldValueSelection: PathSelection;
        if (childFieldDefinition.scalar === true) {
            fieldValueSelection = SCALAR_VALUE_SELECTION;
        } else {
            fieldValueSelection = {
                kind: 'Link',
                name: 'value',
                nullable: true,
                fragment: {
                    kind: 'Fragment',
                    private: ['eTag', 'weakEtag'],
                    selections: createRecordSelection(childFieldDefinition),
                },
            };
        }

        const fieldSelection: LinkSelection = {
            kind: 'Link',
            name: childFieldDefinition.name,
            required: childFieldDefinition.optional === true ? false : undefined,
            fragment: {
                kind: 'Fragment',
                private: [],
                selections: [DISPLAY_VALUE_SELECTION, fieldValueSelection],
            },
        };
        ArrayPrototypePush.call(fieldsSelection, fieldSelection);
    }

    return {
        kind: 'Object',
        name: propertyName,
        selections: fieldsSelection,
    };
}

/**
 * Convert a RecordRepresentationLike into its equivalent selection.
 */
export function createPathSelectionFromValue(
    fields: FieldMapRepresentation['fields']
): PathSelection {
    const fieldsSelection: PathSelection[] = [];

    const fieldNames = ObjectKeys(fields);
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const { value: fieldValue } = fields[fieldName];

        let fieldValueSelection = SCALAR_VALUE_SELECTION;
        if (isSpanningRecord(fieldValue)) {
            fieldValueSelection = {
                kind: 'Link',
                name: 'value',
                nullable: true,
                fragment: {
                    kind: 'Fragment',
                    private: [],
                    selections: buildSelectionFromRecord(fieldValue),
                },
            };
        }

        const fieldSelection: LinkSelection = {
            kind: 'Link',
            name: fieldName,
            required: undefined,
            fragment: {
                kind: 'Fragment',
                private: [],
                selections: [DISPLAY_VALUE_SELECTION, fieldValueSelection],
            },
        };
        ArrayPrototypePush.call(fieldsSelection, fieldSelection);
    }

    return {
        kind: 'Object',
        name: FIELDS_SELECTION.name,
        selections: fieldsSelection,
    };
}

function extractRecordFieldsRecursively(record: FieldMapRepresentation): string[] {
    const fields: string[] = [];

    const fieldNames = ObjectKeys(record.fields);
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const { value: fieldValue } = record.fields[fieldName];

        if (isSpanningRecord(fieldValue)) {
            const spanningRecordFields = extractRecordFieldsRecursively(fieldValue);
            for (let j = 0, len = spanningRecordFields.length; j < len; j++) {
                spanningRecordFields[j] = `${fieldName}.${spanningRecordFields[j]}`;
            }

            ArrayPrototypePush.apply(fields, spanningRecordFields);
        } else {
            ArrayPrototypePush.call(fields, fieldName);
        }
    }

    return fields;
}

/**
 * Returns a list of fields for a RecordRepresentationLike.
 *
 * TODO [W-6900271]: Remove this function once getRelatedList don't depend on it anymore. Always prefer
 * generating a selection out of a record, than convert a record to a field list and back to a
 * selection.
 */
export function extractFields(value: FieldMapRepresentation): string[] {
    const { apiName } = value;

    const fields = extractRecordFieldsRecursively(value);
    for (let i = 0, len = fields.length; i < len; i++) {
        fields[i] = `${apiName}.${fields[i]}`;
    }

    return fields;
}

export function insertFieldsIntoTrie(root: RecordFieldTrie, fields: string[], optional?: boolean) {
    for (let i = 0, len = fields.length; i < len; i++) {
        const field = fields[i].split(FIELD_SEPARATOR);

        let current = root;
        for (let j = 1, len = field.length; j < len && j <= MAX_RECORD_DEPTH + 1; j++) {
            const fieldName = field[j];
            let next = current.children[fieldName];

            if (next === undefined) {
                // A field is scalar only if it is the last field name in the field.
                const scalar = j === len - 1;

                // LDS restricts the numbers of fields that can be traversed to MAX_RECORD_DEPTH,
                // however we still denormalize fields at MAX_RECORD_DEPTH + 1, only if they are
                // scalar fields.
                if (j <= MAX_RECORD_DEPTH || scalar === true) {
                    // We now know that there are children fields, so we can mark the parent
                    // as not a scalar
                    current.scalar = false;
                    next = {
                        name: fieldName,
                        scalar,
                        optional,
                        children: {},
                    };
                    current.children[fieldName] = next;
                }
            }

            current = next;
        }
    }
}
