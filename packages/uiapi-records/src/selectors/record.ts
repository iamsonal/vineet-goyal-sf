import { PathSelection } from '@ldsjs/engine';

import { ObjectKeys, ArrayPrototypePush } from '../util/language';

import { RecordRepresentation } from './../generated/types/RecordRepresentation';
import { RecordCreateDefaultRecordRepresentation } from '../generated/types/RecordCreateDefaultRecordRepresentation';

type RecordRepresentationLike = RecordRepresentation | RecordCreateDefaultRecordRepresentation;

/**
 * A trie data structure representing where each node represents a field on a RecordRepresentation.
 */
interface RecordFieldTrie {
    name: string;
    scalar: boolean;
    optional: boolean;
    children: { [name: string]: RecordFieldTrie };
}

export const MAX_RECORD_DEPTH = 5;
const FIELD_SEPARATOR = '.';

const API_NAME_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'apiName',
};
const CHILD_RELATIONSHIP_SELECTION: PathSelection = {
    // We don't support RecordRep.childRelationships because it has a nasty
    // degenerate case of multiple pages of child records
    kind: 'Object',
    name: 'childRelationships',
};
const ID_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'id',
};
const LAST_MODIFIED_BY_ID_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'lastModifiedById',
};
const LAST_MODIFIED_BY_DATE_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'lastModifiedDate',
};
const RECORD_TYPE_ID_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'recordTypeId',
};
const RECORD_TYPE_INFO_SELECTION: PathSelection = {
    kind: 'Object',
    name: 'recordTypeInfo',
    nullable: true,
    selections: [
        {
            kind: 'Scalar',
            name: 'available',
        },
        {
            kind: 'Scalar',
            name: 'defaultRecordTypeMapping',
        },
        {
            kind: 'Scalar',
            name: 'master',
        },
        {
            kind: 'Scalar',
            name: 'name',
        },
        {
            kind: 'Scalar',
            name: 'recordTypeId',
        },
    ],
};
const SYSTEM_MODSTAMP_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'systemModstamp',
};

const DISPLAY_VALUE_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'displayValue',
};
const SCALAR_VALUE_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'value',
};

function isSpanningRecord(
    fieldValue: null | string | number | boolean | RecordRepresentation
): fieldValue is RecordRepresentation {
    return fieldValue !== null && typeof fieldValue === 'object';
}

function insertFieldsIntoTrie(root: RecordFieldTrie, fields: string[], optional: boolean) {
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

function convertTrieToSelection(fieldDefinition: RecordFieldTrie): PathSelection[] {
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
                selections: convertTrieToSelection(childFieldDefinition),
            };
        }

        ArrayPrototypePush.call(fieldsSelection, {
            kind: 'Link',
            name: childFieldDefinition.name,
            required: childFieldDefinition.optional === true ? false : undefined,
            selections: [DISPLAY_VALUE_SELECTION, fieldValueSelection],
        });
    }

    return [
        API_NAME_SELECTION,
        CHILD_RELATIONSHIP_SELECTION,
        ID_SELECTION,
        LAST_MODIFIED_BY_ID_SELECTION,
        LAST_MODIFIED_BY_DATE_SELECTION,
        RECORD_TYPE_ID_SELECTION,
        RECORD_TYPE_INFO_SELECTION,
        SYSTEM_MODSTAMP_SELECTION,
        {
            kind: 'Object',
            name: 'fields',
            selections: fieldsSelection,
        },
    ];
}

/**
 * Convert a list of fields and optional fields into RecordRepresentation its equivalent
 * selection.
 */
export function buildSelectionFromFields(
    fields: string[],
    optionalFields: string[] = []
): PathSelection[] {
    const root: RecordFieldTrie = {
        name: '<root>',
        optional: false,
        scalar: false,
        children: {},
    };

    insertFieldsIntoTrie(root, fields, false);
    insertFieldsIntoTrie(root, optionalFields, true);

    return convertTrieToSelection(root);
}

/**
 * Convert a RecordRepresentationLike into its equivalent selection.
 */
export function buildSelectionFromRecord(record: RecordRepresentationLike): PathSelection[] {
    const fieldsSelection: PathSelection[] = [];

    const { fields } = record;
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
                selections: buildSelectionFromRecord(fieldValue),
            };
        }

        ArrayPrototypePush.call(fieldsSelection, {
            kind: 'Link',
            name: fieldName,
            required: undefined,
            selections: [DISPLAY_VALUE_SELECTION, fieldValueSelection],
        });
    }

    return [
        API_NAME_SELECTION,
        CHILD_RELATIONSHIP_SELECTION,
        ID_SELECTION,
        LAST_MODIFIED_BY_ID_SELECTION,
        LAST_MODIFIED_BY_DATE_SELECTION,
        RECORD_TYPE_ID_SELECTION,
        RECORD_TYPE_INFO_SELECTION,
        SYSTEM_MODSTAMP_SELECTION,
        {
            kind: 'Object',
            name: 'fields',
            selections: fieldsSelection,
        },
    ];
}

function extractRecordFieldsRecursively(record: RecordRepresentationLike): string[] {
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
 * TODO W-6900271 - Remove this function once getRelatedList don't depend on it anymore. Always prefer
 * generating a selection out of a record, than convert a record to a field list and back to a
 * selection.
 */
export function extractRecordFields(record: RecordRepresentationLike): string[] {
    const { apiName } = record;

    const fields = extractRecordFieldsRecursively(record);
    for (let i = 0, len = fields.length; i < len; i++) {
        fields[i] = `${apiName}.${fields[i]}`;
    }

    return fields;
}
