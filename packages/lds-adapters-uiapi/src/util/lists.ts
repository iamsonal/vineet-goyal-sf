import { LDS, PathSelection } from '@ldsjs/engine';
import {
    keyBuilder as ListInfoRepresentation_keyBuilder,
    ListInfoRepresentation,
    select as ListInfoRepresentation_select,
} from '../generated/types/ListInfoRepresentation';
import { keyBuilder as ListRecordCollection_keyBuilder } from '../generated/types/ListRecordCollectionRepresentation';
import { ListReferenceRepresentation } from '../generated/types/ListReferenceRepresentation';
import { ListUiRepresentation } from '../generated/types/ListUiRepresentation';
import { RecordRepresentation } from '../generated/types/RecordRepresentation';
import { ObjectKeys } from './language';
import { isGraphNode } from './records';
import { isFulfilledSnapshot } from './snapshot';

export interface ListReferenceQuery {
    listViewId?: string;
    objectApiName?: string;
    listViewApiName?: string | Symbol;
}

// TODO - these really should be in the store
interface ListReferences {
    byId: { [key: string]: ListReferenceRepresentation };
    byApiNames: { [key: string]: ListReferenceRepresentation };
}

const listReferences: ListReferences = {
    byId: {},
    byApiNames: {},
};

/**
 * Adds a list reference so it can be retrieved with #getListReference later.
 *
 * @param listRef list reference
 */
export function addListReference(listRef: ListReferenceRepresentation): void {
    if (listRef.id) {
        listReferences.byId[listRef.id] = listRef;
    }
    listReferences.byApiNames[`${listRef.objectApiName}:${listRef.listViewApiName}`] = listRef;
}

/**
 * Returns a list reference from the store if it's present.
 *
 * @param query list view to look for
 * @param lds LDS
 */
export function getListReference(
    query: ListReferenceQuery
): ListReferenceRepresentation | undefined {
    return query.listViewId
        ? listReferences.byId[query.listViewId]
        : listReferences.byApiNames[`${query.objectApiName}:${query.listViewApiName}`];
}

/**
 * Reader selections to copy a list info
 */
export const LIST_INFO_SELECTIONS: PathSelection[] = ListInfoRepresentation_select().selections;

/**
 * List info private memebers
 */
export const LIST_INFO_PRIVATES: string[] = ListInfoRepresentation_select().private;

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
        node: { kind: 'Fragment', selections: LIST_INFO_SELECTIONS_ETAG, private: [] },
        variables: {},
    });

    if (isFulfilledSnapshot(lookupResult)) {
        return lookupResult.data;
    }
}

// The server assumes defaults for certain config fields, which makes caching
// requests that rely on those defaults challenging. The following logic keeps
// track of default values that we've seen the server supply for past
// requests so that we can guess what those values will be on future requests.

// TODO - look at generalizing this so we can declaratively tell LDS to remember
// default values from the server.

// TODO - these really should be in the store

export interface ServerDefaultable {
    sortBy?: string[];
}

export interface ServerDefaults {
    sortBy?: string[];
}

const serverDefaults: { [key: string]: ServerDefaults } = {};

/**
 * Update the default values based on a server response.
 *
 * @param config getListUi config
 * @param serverResponse ListUiRepresentation from the server
 */
export function addServerDefaults(
    config: ListReferenceQuery & ServerDefaultable,
    serverResponse: ListUiRepresentation
): void {
    const key = `${serverResponse.info.listReference.objectApiName}:${serverResponse.info.listReference.listViewApiName}`;
    let defaults = serverDefaults[key] || (serverDefaults[key] = {});

    if (config.sortBy === undefined && serverResponse.records.sortBy !== null) {
        defaults.sortBy = serverResponse.records.sortBy;
    }
}

/**
 * Returns default values observed on previous requests for a list.
 *
 * @param config getListUi config
 * @returns defaults from previous requests for this list, or {} if no defaults are known
 */
export function getServerDefaults(config: ListReferenceQuery): ServerDefaults {
    const listRef = getListReference(config);
    if (listRef === undefined) {
        return {};
    }

    const key = `${listRef.objectApiName}:${listRef.listViewApiName}`;
    return serverDefaults[key] || {};
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
