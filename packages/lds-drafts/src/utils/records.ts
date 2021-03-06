import type { ResourceRequest, StoreLink, StoreRecordError, Adapter } from '@luvio/engine';
import type {
    RecordRepresentation,
    FieldValueRepresentation,
    RecordRepresentationNormalized,
    GetObjectInfoConfig,
    ObjectInfoRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { keyBuilderRecord, buildSelectionFromFields } from '@salesforce/lds-adapters-uiapi';
import {
    ArrayIsArray,
    ArrayPrototypeShift,
    JSONParse,
    JSONStringify,
    ObjectKeys,
} from './language';
import type { Selector, PathSelection } from '@luvio/engine';
import type { CompletedDraftAction, DraftAction } from '../main';
import {
    buildRecordFieldStoreKey,
    extractRecordIdFromStoreKey,
    isStoreKeyRecordId,
} from '@salesforce/lds-uiapi-record-utils';
import type { DraftActionMap, QueueOperation } from '../DraftQueue';
import { QueueOperationType } from '../DraftQueue';
import { isLDSDraftAction } from '../actionHandlers/LDSActionHandler';
import type { DurableStore, DurableStoreEntries, DurableStoreEntry } from '@luvio/environments';
import { DefaultDurableSegment } from '@luvio/environments';
import { getObjectInfosForRecords } from './objectInfo';
import type { RecordDenormalizingDurableStore } from '../durableStore/makeRecordDenormalizingDurableStore';

type ScalarFieldType = boolean | number | string | null;
type DraftFields = { [key: string]: ScalarFieldType };

export interface ScalarFieldRepresentationValue {
    displayValue: string | null;
    value: ScalarFieldType;
}

interface LinkFieldRepresentationValue {
    displayValue: string | null;
    value: StoreLink;
}

type DurableFieldRepresentation = ScalarFieldRepresentationValue | LinkFieldRepresentationValue;

const DRAFT_ACTION_KEY_JUNCTION = '__DraftAction__';
const DRAFT_ACTION_KEY_REGEXP = new RegExp(`(.*)${DRAFT_ACTION_KEY_JUNCTION}([a-zA-Z0-9]+)$`);
const DEFAULT_FIELD_CREATED_BY_ID = 'CreatedById';
const DEFAULT_FIELD_CREATED_DATE = 'CreatedDate';
const DEFAULT_FIELD_ID = 'Id';
const DEFAULT_FIELD_LAST_MODIFIED_BY_ID = 'LastModifiedById';
const DEFAULT_FIELD_LAST_MODIFIED_DATE = 'LastModifiedDate';
const DEFAULT_FIELD_OWNER_ID = 'OwnerId';

export function isDraftActionStoreRecordKey(key: string) {
    return DRAFT_ACTION_KEY_REGEXP.test(key);
}

// TODO [W-8220618]: remove this once generated RecordRepresentation has drafts node on it
export interface DraftRecordRepresentation extends RecordRepresentation {
    drafts?: DraftRepresentation;
}

export interface DurableRecordRepresentation extends Omit<DraftRecordRepresentation, 'fields'> {
    fields: { [key: string]: DurableFieldRepresentation };
    links: { [key: string]: StoreLink };
}

// Either a DurableRecordRepresentation or StoreRecordError can live at a record key
export type DurableRecordEntry = DurableRecordRepresentation | StoreRecordError;

export function isStoreRecordError(
    storeRecord: DurableRecordEntry | RecordRepresentationNormalized
): storeRecord is StoreRecordError {
    return (storeRecord as StoreRecordError).__type === 'error';
}

export function isEntryDurableRecordRepresentation(
    entry: DurableStoreEntry<any>,
    key: string
): entry is DurableStoreEntry<DurableRecordRepresentation> {
    // Either a DurableRecordRepresentation or StoreRecordError can live at a record key
    return isStoreKeyRecordId(key) && (entry.data as StoreRecordError).__type === undefined;
}

export interface RequestFields {
    fields: string[];
    optionalFields: string[];
}

/**
 * Formats the display value for a draft field
 * @param value the value to format
 */
function formatDisplayValue(value: boolean | number | string | null) {
    // TODO [W-7919614]: This method should properly format displayValues for FieldValueRepresentations
    return value === null ? null : value.toString();
}

// creates a link node
export function createLink(key: string) {
    return { __ref: key };
}

const ETAG_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'eTag',
};

const WEAK_ETAG_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'weakEtag',
};

const DRAFTS_SELECTION: PathSelection = {
    kind: 'Object',
    opaque: true,
    name: 'drafts',
    required: false,
};

export const RECORD_ENDPOINT_REGEX = /^\/ui-api\/records\/?(([a-zA-Z0-9]+))?$/;

export interface DraftRepresentation {
    created: boolean;
    edited: boolean;
    deleted: boolean;
    serverValues: { [fieldName: string]: ScalarFieldRepresentationValue };
    draftActionIds: string[];
    latestDraftActionId: string;
}

export interface DraftRecordRepresentationNormalized extends RecordRepresentationNormalized {
    drafts: DraftRepresentation;
}

export function isDraftRecordRepresentationNormalized(
    record: RecordRepresentationNormalized
): record is DraftRecordRepresentationNormalized {
    return (record as any).drafts !== undefined;
}

export function prefixForRecordId(recordId: string): string {
    if (recordId.length >= 3) {
        return recordId.slice(0, 3);
    }
    return '';
}

/**
 * Builds synthetic FieldValueRepresentations for fields that have draft changes applied
 * @param fields List of draft record fields
 */
export function buildRecordFieldValueRepresentationsFromDraftFields(
    fields: DraftFields,
    objectInfo: ObjectInfoRepresentation | undefined
) {
    const fieldNames = ObjectKeys(fields);
    const recordFields: Record<string, DurableFieldRepresentation> = {};
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const draftField = fields[fieldName];
        recordFields[fieldName] = {
            value: draftField,
            displayValue: formatDisplayValue(draftField),
        };

        if (objectInfo !== undefined) {
            const fieldInfo = objectInfo.fields[fieldName];

            if (fieldInfo !== undefined) {
                const { dataType, relationshipName } = fieldInfo;
                if (dataType === 'Reference' && relationshipName !== null) {
                    if (typeof draftField !== 'string') {
                        throw Error('reference field value is not a string');
                    }

                    const key = keyBuilderRecord({ recordId: draftField });
                    recordFields[relationshipName] = {
                        displayValue: null,
                        value: createLink(key),
                    };
                }
            }
        }
    }
    return recordFields;
}

/**
 * Creates a synthetic record based on information included in a draft create operation
 * @param userId The current user id, will be the record created by id
 * @param draftId The client-side id representing the record
 * @param apiName The api-name of the record
 * @param draftFields List of fields included in the create request
 * @param lastModifiedDate A string of the date the record was last modified
 * @param createdDate A string of the date the record was created
 */
export function buildSyntheticRecordRepresentation(
    action: DraftAction<RecordRepresentation, ResourceRequest>,
    userId: string,
    objectInfo: ObjectInfoRepresentation | undefined
): DurableRecordRepresentation {
    const { timestamp, data, targetId: recordId, tag: recordKey, id: actionId } = action;
    const { body } = data;
    const { apiName } = body;

    const fields = buildRecordFieldValueRepresentationsFromDraftFields(body.fields, objectInfo);

    // add default fields
    fields[DEFAULT_FIELD_CREATED_BY_ID] = { value: userId, displayValue: null };
    fields[DEFAULT_FIELD_CREATED_DATE] = { value: timestamp, displayValue: null };
    fields[DEFAULT_FIELD_LAST_MODIFIED_BY_ID] = { value: userId, displayValue: null };
    fields[DEFAULT_FIELD_LAST_MODIFIED_DATE] = { value: timestamp, displayValue: null };
    fields[DEFAULT_FIELD_OWNER_ID] = { value: userId, displayValue: null };
    fields[DEFAULT_FIELD_ID] = { value: recordId, displayValue: null };

    const links: { [key: string]: StoreLink } = {};
    const fieldNames = ObjectKeys(fields);
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        links[fieldName] = { __ref: buildRecordFieldStoreKey(recordKey, fieldName) };
    }

    // add isMissing for every field in the object info not in the action body
    if (objectInfo !== undefined) {
        const fieldNames = ObjectKeys(objectInfo.fields);
        const fieldsLength = fieldNames.length;
        for (let i = 0; i < fieldsLength; i++) {
            const fieldName = fieldNames[i];
            if (fields[fieldName] === undefined) {
                links[fieldName] = { isMissing: true };
            }
        }
    }

    const timestampString = timestamp.toString();

    return {
        id: recordId,
        apiName,
        childRelationships: {},
        eTag: '',
        lastModifiedById: userId,
        lastModifiedDate: timestampString,
        recordTypeId: null,
        recordTypeInfo: null,
        systemModstamp: timestampString,
        weakEtag: -1,
        fields,
        drafts: {
            created: true,
            edited: false,
            deleted: false,
            serverValues: {},
            draftActionIds: [actionId],
            latestDraftActionId: actionId,
        },
        links,
    };
}

/**
 * Builds a Selector for a record
 * @param recordKey The store key for a record
 * @param fields The list of fields to include in the selector
 */
export function buildRecordSelector(
    recordKey: string,
    fields: string[],
    optionalFields: string[]
): Selector {
    return {
        recordId: recordKey,
        node: {
            kind: 'Fragment',
            private: [],
            selections: [
                ...buildSelectionFromFields(fields, optionalFields),
                ETAG_SELECTION,
                WEAK_ETAG_SELECTION,
                DRAFTS_SELECTION,
            ],
        },
        variables: {},
    };
}

/**
 * Extracts the recordId from a request's urlParams. If the id does not exist, undefined returned
 * @param request Resource request
 */
export function extractRecordIdFromResourceRequest(request: ResourceRequest): string | undefined {
    const id = request.urlParams['recordId'];
    if (typeof id !== 'string') {
        return undefined;
    }
    return id;
}

/**
 * Extracts record id from a ResourceRequest and returns it's corresponding store key
 * If a record id is not found, undefined is returned
 * @param request Resource request containing a record id in it's urlParams
 */
export function getRecordKeyFromResourceRequest(request: ResourceRequest): string | undefined {
    const recordId = extractRecordIdFromResourceRequest(request);
    if (recordId === undefined) {
        return undefined;
    }
    return keyBuilderRecord({ recordId });
}

/**
 * Extracts a record id from a record ResourceRequest. This method parses out the
 * recordId from the request path in the case of get, update, and delete.
 * @param request The ResourceRequest to extract the record id from
 */
export function getRecordIdFromRecordRequest(request: ResourceRequest): string | undefined {
    const { method, basePath } = request;
    if (basePath === undefined) {
        return undefined;
    }

    let recordId = '';
    switch (method) {
        case 'get':
        case 'patch':
        case 'delete': {
            const matches = basePath.match(RECORD_ENDPOINT_REGEX);
            if (!matches || matches.length !== 3) {
                return undefined;
            }
            recordId = matches[2];
            break;
        }
        default: {
            return undefined;
        }
    }
    return recordId;
}

/**
 * Builds a record store key given its record id
 * @param recordId record id
 */
export function getRecordKeyForId(recordId: string) {
    return keyBuilderRecord({ recordId });
}

/**
 * Gets the store key for the record id that a POST/PATCH/DELETE record request targets
 * @param resourceRequest
 */
export function getRecordKeyFromRecordRequest(resourceRequest: ResourceRequest) {
    const id = getRecordIdFromRecordRequest(resourceRequest);
    if (id === undefined) {
        return undefined;
    }

    return getRecordKeyForId(id);
}

/**
 * Extracts the record fields from a record PATCH or POST ResourceRequest body or
 * a GET ResourceRequest params.  This will return the fields without the apiName
 * prepended, so "Name" instead of "Account.Name".
 * @param request The resource request
 */
export function getRecordFieldsFromRecordRequest(request: ResourceRequest): RequestFields {
    const { method, body } = request;
    if (method === 'patch' || method === 'post') {
        if (body === undefined) {
            return {
                fields: [],
                optionalFields: [],
            };
        }
        const bodyFields = ObjectKeys(body.fields);
        return {
            fields: bodyFields,
            optionalFields: [],
        };
    }

    if (method === 'get') {
        const fieldsParam = request.queryParams['fields'] as string[];
        const fields = ArrayIsArray(fieldsParam) ? fieldsParam : [];
        const optionalFieldsParam = (request.queryParams['optionalFields'] as string[]) || [];
        const optionalFields: string[] = ArrayIsArray(optionalFieldsParam)
            ? optionalFieldsParam
            : [];
        return {
            fields: fields.map((f) => f.substring(f.indexOf('.') + 1)),
            optionalFields: optionalFields.map((f) => f.substring(f.indexOf('.') + 1)),
        };
    }
    return {
        fields: [],
        optionalFields: [],
    };
}

/**
 * Replays an ordered draft list on top of a record. If undefined is passed in, the first draft must
 * be a POST action
 * @param record The base record to apply drafts to
 * @param drafts The list of drafts to apply to the record
 * @param userId The current user id, will be the last modified id
 */
export function replayDraftsOnRecord(
    record: DurableRecordRepresentation | undefined,
    drafts: DraftAction<RecordRepresentation, ResourceRequest>[],
    objectInfo: ObjectInfoRepresentation | undefined,
    userId: string
): DurableRecordRepresentation {
    if (record === undefined) {
        if (drafts.length === 0) {
            throw Error('cannot synthesize a record without a post draft action');
        }
        const postAction = drafts[0];
        if (postAction.data.method !== 'post') {
            throw Error('cannot synthesize a record without a post draft action');
        }
        const syntheticRecord = buildSyntheticRecordRepresentation(postAction, userId, objectInfo);
        drafts.shift();
        return replayDraftsOnRecord(syntheticRecord, drafts, objectInfo, userId);
    }
    if (drafts.length === 0) {
        return record;
    }

    // remove the next item from the front of the queue
    const draft = ArrayPrototypeShift.call(drafts);
    if (draft === undefined) {
        return record;
    }
    const method = draft.data.method;

    if (method === 'post') {
        throw Error('a post draft action cannot exist on an existing record');
    }

    // add the draft node
    if (record.drafts === undefined) {
        record.drafts = {
            created: false,
            edited: false,
            deleted: false,
            serverValues: {},
            draftActionIds: [draft.id],
            latestDraftActionId: draft.id,
        };
    } else {
        record.drafts.draftActionIds = [...record.drafts.draftActionIds, draft.id];
        record.drafts.latestDraftActionId = draft.id;
    }

    if (method === 'delete') {
        if (drafts.length > 0) {
            throw Error('cannot contain drafts after a terminal delete');
        }
        record.drafts.deleted = true;
        return record;
    }

    const fields = draft.data.body.fields;
    const draftFields = buildRecordFieldValueRepresentationsFromDraftFields(fields, objectInfo);

    const fieldNames = ObjectKeys(draftFields);
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];

        // don't apply server values to draft created records
        if (
            record.drafts.created === false &&
            record.drafts.serverValues[fieldName] === undefined
        ) {
            record.drafts.serverValues[fieldName] = record.fields[
                fieldName
            ] as ScalarFieldRepresentationValue;
        }
        record.fields[fieldName] = draftFields[fieldName];
    }

    record.drafts.edited = true;

    // update last modified date to draft action time and
    // last modified to user id
    const lastModifiedDate = new Date(draft.timestamp).toISOString();
    record.lastModifiedById = userId;
    record.lastModifiedDate = lastModifiedDate;

    record.fields[DEFAULT_FIELD_LAST_MODIFIED_BY_ID] = { value: userId, displayValue: null };
    record.fields[DEFAULT_FIELD_LAST_MODIFIED_DATE] = {
        value: lastModifiedDate,
        //TODO: will format the display value properly when ObjectInfo and
        //      locationization functionality are integrated in,
        //      for now just use the raw value for display
        displayValue: lastModifiedDate,
    };

    return replayDraftsOnRecord(record, drafts, objectInfo, userId);
}

export function buildDraftDurableStoreKey(recordKey: string, draftActionId: string) {
    return `${recordKey}${DRAFT_ACTION_KEY_JUNCTION}${draftActionId}`;
}

export function extractRecordKeyFromDraftDurableStoreKey(key: string) {
    if (key === undefined) {
        return undefined;
    }
    const matches = key.match(DRAFT_ACTION_KEY_REGEXP);
    if (!matches || matches.length !== 3) {
        return undefined;
    }
    return matches[1];
}

/**
 * Returns a set of Queue operations that the DraftQueue must perform to update itself with
 * new id references after a record has been created.
 * @param completedAction The action associated with the record that has just been created
 * @param queue The remaining queue items
 */
export function updateQueueOnPost(
    completedAction: CompletedDraftAction<unknown, unknown>,
    queue: DraftAction<unknown, unknown>[]
): QueueOperation[] {
    const queueOperations: QueueOperation[] = [];
    const { response } = completedAction;
    const record = response.body as RecordRepresentation;
    const draftKey = completedAction.tag;
    const draftId = extractRecordIdFromStoreKey(draftKey);
    if (draftId === undefined) {
        throw Error('could not extract id from record key');
    }
    const { id: canonicalRecordId } = record;
    if (canonicalRecordId === undefined) {
        throw Error('could not id in record response');
    }
    const { length } = queue;

    for (let i = 0; i < length; i++) {
        const queueAction = queue[i];
        if (isLDSDraftAction(queueAction)) {
            const {
                tag: queueActionTag,
                data: queueActionRequest,
                id: queueActionId,
            } = queueAction;
            const { basePath, body } = queueActionRequest;
            const stringifiedBody = JSONStringify(body);
            const needsReplace =
                basePath.search(draftId) >= 0 || stringifiedBody.search(draftId) >= 0;

            if (needsReplace) {
                const updatedBasePath = basePath.replace(draftId, canonicalRecordId);
                const updatedBody = stringifiedBody.replace(draftId, canonicalRecordId);

                // if the action is performed on a previous draft id, we need to replace the action
                // with a new one at the updated canonical key
                if (queueActionTag === draftKey) {
                    const canonicalRecordKey = keyBuilderRecord({ recordId: canonicalRecordId });

                    const updatedAction: DraftAction<unknown, ResourceRequest> = {
                        ...queueAction,
                        tag: canonicalRecordKey,
                        data: {
                            ...queueActionRequest,
                            basePath: updatedBasePath,
                            body: JSONParse(updatedBody),
                        },
                    };
                    // item needs to be replaced with a new item at the new record key
                    queueOperations.push({
                        type: QueueOperationType.Delete,
                        id: queueActionId,
                    });
                    queueOperations.push({
                        type: QueueOperationType.Add,
                        action: updatedAction,
                    });
                } else {
                    const updatedAction: DraftAction<unknown, ResourceRequest> = {
                        ...queueAction,
                        data: {
                            ...queueActionRequest,
                            basePath: updatedBasePath,
                            body: JSONParse(updatedBody),
                        },
                    };
                    // item needs to be updated
                    queueOperations.push({
                        type: QueueOperationType.Update,
                        id: queueActionId,
                        action: updatedAction,
                    });
                }
            }
        }
    }

    return queueOperations;
}

/**
 * Filters a records field list
 * @param record The record
 * @param requestFields fields to filter to
 * @returns a record with the filtered fields
 */
export function filterRecordFields(
    record: DraftRecordRepresentation,
    requestFields: RequestFields
) {
    const filteredFields: { [key: string]: FieldValueRepresentation } = {};
    const { fields, optionalFields } = requestFields;
    const denormalizedFields = record.fields;
    for (const field of fields) {
        const denormalizedField = denormalizedFields[field];
        if (denormalizedField === undefined) {
            return;
        }
        filteredFields[field] = denormalizedField;
    }
    for (const field of optionalFields) {
        const denormalizedField = denormalizedFields[field];
        if (denormalizedField !== undefined) {
            filteredFields[field] = denormalizedField;
        }
    }
    return { ...record, fields: filteredFields };
}

/**
 * Extracts a list of fields from a @see {DurableRecordRepresentation} to a provided map. If the field
 * is a spanning record, it includes the Id field of the nested record
 * @param record
 * @param fieldList
 */
export function extractFields(
    record: DurableRecordRepresentation,
    fieldList: Record<string, true>
) {
    const fieldNames = ObjectKeys(record.fields);
    const linkNames = ObjectKeys(record.links);
    const apiName = record.apiName;
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const field = record.fields[fieldName] as any;
        if (field.__ref === undefined) {
            fieldList[`${apiName}.${fieldName}`] = true;
        } else {
            // include spanning Id field
            fieldList[`${apiName}.${fieldName}.Id`] = true;
        }
    }
    // Add missing links to field list since they need to be refreshed
    for (let i = 0, len = linkNames.length; i < len; i++) {
        const linkName = linkNames[i];
        const link = record.links[linkName];
        if (link.isMissing === true) {
            fieldList[`${apiName}.${linkName}`] = true;
        }
    }
}

/**
 * Restores a record to its last known server-state by removing any applied drafts it may have
 * @param record record with drafts applied
 * @returns
 */
export function removeDrafts(
    record: DurableRecordRepresentation
): DurableRecordRepresentation | undefined {
    const { drafts, fields } = record;
    if (drafts === undefined) {
        return record;
    }

    if (drafts.created === true) {
        return undefined;
    }
    const updatedFields: { [key: string]: any } = {};
    const fieldNames = ObjectKeys(fields);
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const field = fields[fieldName];

        const originalField = drafts.serverValues[fieldName];
        if (originalField !== undefined) {
            updatedFields[fieldName] = originalField;
        } else {
            updatedFields[fieldName] = field;
        }
    }

    return { ...record, drafts: undefined, fields: updatedFields };
}

export type GetDraftActionsForRecords = (keys: string[]) => Promise<DraftActionMap>;

export interface DraftResolutionInput {
    record: DurableStoreEntry<DurableRecordRepresentation>;
    drafts: DraftAction<RecordRepresentation, ResourceRequest>[];
    objectInfo: ObjectInfoRepresentation | undefined;
}

/**
 * Extracts the relevant object infos and drafts for a set of durable store record entries
 * @param records A set of DurableStoreEntries containing records
 * @param durableStore the durable store
 * @param getDraftActions function to get draft actions for a set of record keys
 * @returns A map of record key to DraftResolutionInput items that can be used to resolve drafts
 */
export function getDraftResolutionInfoForRecordSet(
    records: DurableStoreEntries<DurableRecordEntry>,
    durableStore: DurableStore,
    getDraftActions: GetDraftActionsForRecords
): Promise<Record<string, DraftResolutionInput>> {
    const keysArray = ObjectKeys(records);

    return Promise.all([
        getDraftActions(keysArray),
        getObjectInfosForRecords(durableStore, records),
    ]).then(([actionMap, objectInfos]) => {
        const results: Record<string, DraftResolutionInput> = {};

        for (let i = 0, len = keysArray.length; i < len; i++) {
            const key = keysArray[i];
            const recordEntry = records[key];
            const record = recordEntry.data;
            // if entry is an error don't extract draft info for it
            if (isStoreRecordError(record)) {
                continue;
            }

            const drafts = (actionMap[key] ?? []).filter((x) => isLDSDraftAction(x)) as DraftAction<
                RecordRepresentation,
                ResourceRequest
            >[];

            const objectInfo = objectInfos[record.apiName];

            if (process.env.NODE_ENV !== 'production') {
                if (drafts.length > 0 && objectInfo === undefined) {
                    throw new Error(
                        `Missing ${record.apiName} object info in cache when drafts are present, drafts may not resolve correctly.`
                    );
                }
            }

            results[key] = {
                record: recordEntry as DurableStoreEntry<DurableRecordRepresentation>,
                drafts,
                objectInfo,
            };
        }
        return results;
    });
}

/**
 * Helper function to extract the apiName property from a set of draft actions
 * that contain actions to create a record. Duplicate api names are filtered out.
 * @param entries
 * @returns array of api names
 */
export function getObjectApiNamesFromDraftCreateEntries(
    entries: DurableStoreEntries<DraftAction<RecordRepresentation, ResourceRequest>>
) {
    const keys = ObjectKeys(entries);
    const apiNames: Record<string, true> = {};
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const entry = entries[key];
        const request = entry.data.data;
        const { method, body } = request;

        if (method !== 'post') {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error('Can only extract apiName from record post request');
            }
        } else {
            apiNames[body.apiName] = true;
        }
    }

    return ObjectKeys(apiNames);
}

/**
 * Ensures that any references in a created or modified record are in the cache.
 * @param durableStore the durable store
 * @param apiName api name of the record being created or modified
 * @param recordInputFields the fields of the record being created or modified
 * @param getObjectInfoAdapter adapter tasked with getting objectInfo for supplied apiName
 * @throws if object info is not cached or referenced entry is missing in the durable store
 */
export function ensureReferencedIdsAreCached(
    durableStore: RecordDenormalizingDurableStore,
    apiName: string,
    recordInputFields: Record<string, ScalarFieldType>,
    getObjectInfoAdapter: Adapter<GetObjectInfoConfig, ObjectInfoRepresentation>
): Promise<void> {
    return Promise.resolve(getObjectInfoAdapter({ objectApiName: apiName }))
        .then((snapshot) => {
            if (snapshot === null || snapshot.data === undefined) {
                // eslint-disable-next-line @salesforce/lds/no-error-in-production
                throw new Error(`ObjectInfo for ${apiName} is not cached`);
            }
            return snapshot.data;
        })
        .then((objectInfo) => {
            const recordReferences: Record<string, true> = {};
            const { fields: objectInfoFieldInformations } = objectInfo;
            const recordInputFieldNames = ObjectKeys(recordInputFields);
            for (let i = 0, len = recordInputFieldNames.length; i < len; i++) {
                const recordInputFieldName = recordInputFieldNames[i];
                const field = recordInputFields[recordInputFieldName];
                const objectInfoFieldInformation =
                    objectInfoFieldInformations[recordInputFieldName];

                if (objectInfoFieldInformation.dataType === 'Reference') {
                    if (typeof field !== 'string') {
                        throw Error(
                            `Reference field value ${recordInputFieldName} is not a string`
                        );
                    }
                    const key = keyBuilderRecord({ recordId: field });
                    recordReferences[key] = true;
                }
            }

            const recordKeys = ObjectKeys(recordReferences);
            return durableStore.getEntries(recordKeys, DefaultDurableSegment).then((entries) => {
                if (entries === undefined) {
                    throw Error('Reference entries are not cached');
                }

                for (let i = 0, len = recordKeys.length; i < len; i++) {
                    const recordKey = recordKeys[i];
                    if (entries[recordKey] === undefined) {
                        const id = extractRecordIdFromStoreKey(recordKey);
                        if (process.env.NODE_ENV !== 'production') {
                            throw new Error(`Referenced record ${id} is not cached`);
                        }
                    }
                }
            });
        });
}
