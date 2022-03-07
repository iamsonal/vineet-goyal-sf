import { stripProperties } from 'test-util';

/**
 * Recurses through a record structure, deleting fields for which the predicate
 * returns false.
 *
 * @param {RecordRepresentation} record Record
 * @param {string} prefix field name prefix for the current record, used to handle
 *    nested records
 * @param {function} predicate function that accepts a qualified field name and
 *    indicates (truthy/falsy return value) if the field should be kept
 * @returns true if the record contains any fields after pruning; false if not
 */
function _pruneFields(record, prefix, predicate) {
    Object.keys(record.fields).forEach((field) => {
        // nested record, recurse
        if (record.fields[field].value && record.fields[field].value.fields) {
            // delete the field if we removed all of its fields
            if (!_pruneFields(record.fields[field].value, `${prefix}${field}.`, predicate)) {
                delete record.fields[field];
            }
        }
        // delete field if predicate says to
        else if (!predicate(prefix + field)) {
            delete record.fields[field];
        }
    });

    return Object.keys(record.fields).length > 0;
}

const DEFAULT_SERVER_FIELDS = [
    'CreatedDate',
    'Id',
    'LastModifiedById',
    'LastModifiedDate',
    'SystemModstamp',
];

/**
 * Returns a field predicate that preserves fields referenced in either a
 * ListInfoRepresentation or an array of additional fields.
 *
 * @param {ListInfoRepresentation} listInfo
 * @param {string[]} extraFields additional fields to be kept
 * @param {boolean} keepMagicServerFields preserves the 5 magic fields from the server
 * @returns field predicate function for #pruneFields
 */
export function fieldPredicate(listInfo, extraFields, keepMagicServerFields = true) {
    let fieldsToKeep = [
        ...listInfo.displayColumns.map((dc) => dc.fieldApiName),
        ...(extraFields || []),
    ];

    return (field) =>
        fieldsToKeep.includes(field) ||
        (keepMagicServerFields &&
            DEFAULT_SERVER_FIELDS.find((f) => field === f || field.endsWith(`.${f}`)));
}

/**
 * Prunes fields from the records in a ListUiRepresentation based on a predicate.
 * Note that the ListUi is modified in place. This function is meant to prune
 * fields from mock data so that it can be compared to data returned by a wire
 * adapter.
 *
 * @param {ListUiRepresentation} listUi
 * @param {function} predicate function that accepts a qualified field name and
 *    indicates (truthy/falsy return value) if the field should be kept
 * @returns listUi
 */
export function pruneFields(listUi, predicate) {
    listUi.records.records.forEach((record) => {
        _pruneFields(record, '', predicate);
    });

    return listUi;
}

/**
 * Changes the fields/optionalFields CSV values in a getListUi config to
 * the corresponding FieldId representation.
 *
 * @param config
 * @returns config
 */
export function convertToFieldIds(config) {
    const toFieldId = (f) => {
        const [objectApiName, ...fieldApiName] = f.split('.');
        return {
            objectApiName,
            fieldApiName: fieldApiName.join('.'),
        };
    };

    if (config.fields) {
        config.fields =
            typeof config.fields === 'string'
                ? toFieldId(config.fields)
                : config.fields.map((f) => toFieldId(f));
    }

    if (config.optionalFields) {
        config.optionalFields =
            typeof config.optionalFields === 'string'
                ? toFieldId(config.optionalFields)
                : config.optionalFields.map((f) => toFieldId(f));
    }

    return config;
}

export function beforeEach() {
    jasmine.addMatchers({
        toEqualListUi: () => {
            return {
                compare: (actual, expected) => {
                    expect(actual.error).toBeUndefined();

                    let { objectApiName } = expected.info.listReference;
                    let extraFields = [
                        ...(expected.records.fields || []),
                        ...(expected.records.optionalFields || []),
                    ].map((f) =>
                        f.startsWith(objectApiName) ? f.substring(objectApiName.length + 1) : f
                    );
                    let patched = pruneFields(
                        stripProperties(expected, [
                            'currentPageUrl',
                            'nextPageUrl',
                            'previousPageUrl',
                            'eTag',
                            'weakEtag',
                        ]),
                        fieldPredicate(expected.info, extraFields)
                    );
                    if (typeof patched.records.sortBy === 'string') {
                        patched.records.sortBy = patched.records.sortBy.split(',');
                    }
                    expect(actual.data).toEqual(patched);
                    expect(actual.data).toBeImmutable();

                    return { pass: true };
                },
            };
        },
    });
}
