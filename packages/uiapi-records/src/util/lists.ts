import { LDS, PathSelection } from '@salesforce-lds/engine';
import {
    keyBuilder as ListInfoRepresentation_keyBuilder,
    ListInfoRepresentation,
    select as ListInfoRepresentation_select,
} from '../generated/types/ListInfoRepresentation';
import { keyBuilder as ListRecordCollection_keyBuilder } from '../generated/types/ListRecordCollectionRepresentation';
import {
    keyBuilder as ListReferenceRepresentation_keyBuilder,
    ListReferenceRepresentation,
} from '../generated/types/ListReferenceRepresentation';
import { select as ListReferenceRepresentation_select } from '../generated/types/ListReferenceRepresentation';
import { isFulfilledSnapshot } from './snapshot';
import { ObjectKeys } from './language';
import { isGraphNode } from './records';
import { RecordRepresentation } from '../generated/types/RecordRepresentation';

export interface ListReferenceQuery {
    listViewId?: string;
    objectApiName?: string;
    listViewApiName?: string | Symbol;
}

// TODO - these really should be in the store
interface ListReferences {
    byId: { [key: string]: string };
    byApiNames: { [key: string]: string };
}

const listReferences: ListReferences = {
    byId: {},
    byApiNames: {},
};

/**
 * Adds a list reference so it can be retrieved with #getListReference later.
 *
 * @param listRef list refenence
 */
export function addListReference(listRef: ListReferenceRepresentation): void {
    const listRefKey = ListReferenceRepresentation_keyBuilder({ id: listRef.id });

    if (listRef.id) {
        listReferences.byId[listRef.id] = listRefKey;
    }
    listReferences.byApiNames[`${listRef.objectApiName}:${listRef.listViewApiName}`] = listRefKey;
}

/**
 * Reader selections to copy a list reference
 */
const LIST_REFERENCE_SELECTIONS: PathSelection[] = ListReferenceRepresentation_select().selections;

/**
 * Returns a list reference from the store if it's present.
 *
 * @param query list view to look for
 * @param lds LDS
 */
export function getListReference(
    query: ListReferenceQuery,
    lds: LDS
): ListReferenceRepresentation | undefined {
    const key = query.listViewId
        ? listReferences.byId[query.listViewId]
        : listReferences.byApiNames[`${query.objectApiName}:${query.listViewApiName}`];

    if (key) {
        const lookupResult = lds.storeLookup<ListReferenceRepresentation>({
            recordId: key,
            node: { kind: 'Fragment', selections: LIST_REFERENCE_SELECTIONS },
            variables: {},
        });

        if (isFulfilledSnapshot(lookupResult)) {
            return lookupResult.data;
        }
    }
}

/**
 * Reader selections to copy a list info
 */
export const LIST_INFO_SELECTIONS: PathSelection[] = ListInfoRepresentation_select().selections;

const LIST_INFO_SELECTIONS_ETAG: PathSelection[] = [
    ...LIST_INFO_SELECTIONS,
    { kind: 'Scalar', name: 'eTag' },
];

/**
 * Retrieves the list info corresponding to the specified list reference from the store.
 *
 * @param listRef list reference
 * @param lds LDS
 */
export function getListInfo(
    listRef: ListReferenceRepresentation,
    lds: LDS
): ListInfoRepresentation | undefined {
    const key = ListInfoRepresentation_keyBuilder(listRef);
    const lookupResult = lds.storeLookup<ListInfoRepresentation>({
        recordId: key,
        node: { kind: 'Fragment', selections: LIST_INFO_SELECTIONS_ETAG },
        variables: {},
    });

    if (isFulfilledSnapshot(lookupResult)) {
        return lookupResult.data;
    }
}

// Logic to deal with fields on the list view. This would be reasonably straightforward
// except that the server sometimes adds 5 well-known fields to every record & nested
// record in its responses.

// hardcoded fields that the server adds
const DEFAULT_SERVER_FIELDS = [
    'CreatedDate',
    'Id',
    'LastModifiedById',
    'LastModifiedDate',
    'SystemModstamp',
];

/**
 * Adds default fields for every record referenced in a given field name. E.g. if field
 * is "Opportunity.Account.Name" then add default fields "Opportunity.CreatedDate",
 * "Opportunity.Id", ..., "Opportunity.Account.CreatedDate", "Opportunity.Account.Id", ... .
 *
 * @param field explicitly included field
 * @param defaultFields fields object to be updated with the fields that the server will
 *    implicitly add
 */
function addDefaultFields(field: string, defaultFields: { [key: string]: boolean }): void {
    const fieldParts = field.split('.');
    for (let i = 1; i < fieldParts.length; ++i) {
        const fieldPrefix = fieldParts.slice(0, i).join('.');

        for (let j = 0; j < DEFAULT_SERVER_FIELDS.length; ++j) {
            defaultFields[`${fieldPrefix}.${DEFAULT_SERVER_FIELDS[j]}`] = true;
        }
    }
}

/**
 * Indicates if a RecordRepresntation contains a specified field.
 *
 * @param record record
 * @param field field to check for, split on '.'s, with the leading object api name omitted.
 *    E.g. if searching an Opportunity for "Opportunity.Account.Name" this parameter should
 *    be ['Account','Name'].
 */
function recordContainsField(record: RecordRepresentation, field: string[]): boolean {
    // make sure it looks like a record and the first piece of the field path has a value
    if (
        !record ||
        !record.fields ||
        !record.fields[field[0]] ||
        record.fields[field[0]].value === undefined
    ) {
        return false;
    }

    // recurse if nested record
    else if (field.length > 1) {
        return recordContainsField(
            record.fields[field[0]].value as RecordRepresentation,
            field.slice(1)
        );
    }

    // found it
    return true;
}

export interface ListFields {
    getRecordSelectionFieldSets: () => [string[], string[]];
    processRecords: (records: RecordRepresentation[]) => ListFields;
}

// structure that we put in the store to keep track of which of the default server
// fields have actually been observed in the response records
interface DefaultServerFieldStatus {
    missingFields: { [key: string]: boolean };
}

export function listFields(
    lds: LDS,
    {
        fields = [],
        optionalFields = [],
        sortBy,
    }: {
        fields?: string[];
        optionalFields?: string[];
        sortBy?: string[];
    },
    listInfo: ListInfoRepresentation
): ListFields {
    const {
        displayColumns,
        listReference: { objectApiName },
    } = listInfo;

    let fields_: { [key: string]: boolean } = {},
        optionalFields_: { [key: string]: boolean } = {},
        defaultFields_: { [key: string]: boolean } = {};

    // all the fields in the list info are required
    for (let i = 0, len = displayColumns.length; i < len; ++i) {
        const qualifiedField = `${objectApiName}.${displayColumns[i].fieldApiName}`;
        fields_[qualifiedField] = true;
        addDefaultFields(qualifiedField, defaultFields_);
    }

    // required fields from the component
    for (let i = 0, len = fields.length; i < len; ++i) {
        const qualifiedField = fields[i].startsWith(`${objectApiName}.`)
            ? fields[i]
            : `${objectApiName}.${fields[i]}`;
        if (!fields_[qualifiedField]) {
            fields_[qualifiedField] = true;
            addDefaultFields(qualifiedField, defaultFields_);
        }
    }

    // optional fields from the component
    for (let i = 0, len = optionalFields.length; i < len; ++i) {
        const qualifiedField = optionalFields[i].startsWith(`${objectApiName}.`)
            ? optionalFields[i]
            : `${objectApiName}.${optionalFields[i]}`;
        if (!fields_[qualifiedField]) {
            optionalFields_[qualifiedField] = true;
            addDefaultFields(qualifiedField, defaultFields_);
        }
    }

    const key =
        ListRecordCollection_keyBuilder({
            listViewId: listInfo.eTag,
            sortBy: sortBy || null,
        }) + '__fieldstatus';
    const node = lds.getNode<DefaultServerFieldStatus>(key);
    const defaultServerFieldStatus = isGraphNode(node)
        ? node.retrieve()
        : { missingFields: { ...defaultFields_ } };

    return {
        getRecordSelectionFieldSets() {
            const optionalPlusDefaultFields = { ...optionalFields_ };

            const fields = ObjectKeys(defaultFields_);
            for (let i = 0; i < fields.length; ++i) {
                const field = fields[i];
                if (!fields_[field] && !defaultServerFieldStatus.missingFields[field]) {
                    optionalPlusDefaultFields[field] = true;
                }
            }

            return [ObjectKeys(fields_).sort(), ObjectKeys(optionalPlusDefaultFields).sort()];
        },

        processRecords(records: RecordRepresentation[]) {
            const { missingFields } = defaultServerFieldStatus;

            const fields = ObjectKeys(missingFields);
            for (let i = 0; i < fields.length; ++i) {
                const field = fields[i],
                    splitField = field.split('.').slice(1);

                for (let i = 0; i < records.length; ++i) {
                    if (recordContainsField(records[i], splitField)) {
                        delete missingFields[field];
                        break;
                    }
                }
            }

            lds.storePublish(key, defaultServerFieldStatus);
            // snapshots do not subscribe to this key, so no need to broadcast

            return this;
        },
    };
}
