import {
    ResourceRequest,
    ProxyGraphNode,
    GraphNode,
    Environment,
    StoreLink,
    StoreRecordError,
    Adapter,
} from '@luvio/engine';
import {
    RecordRepresentation,
    keyBuilderRecord,
    FieldValueRepresentation,
    buildSelectionFromFields,
    RecordRepresentationNormalized,
    GetRecordConfig,
    ObjectInfoRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import {
    ArrayIsArray,
    ArrayPrototypeShift,
    JSONParse,
    JSONStringify,
    ObjectAssign,
    ObjectKeys,
} from './language';
import { Selector, PathSelection } from '@luvio/engine';
import { CompletedDraftAction, DraftAction } from '../main';
import {
    buildRecordFieldStoreKey,
    extractRecordIdFromStoreKey,
    isStoreKeyRecordId,
} from '@salesforce/lds-uiapi-record-utils';
import { DraftIdMappingEntry, QueueOperation, QueueOperationType } from '../DraftQueue';
import { isLDSDraftAction } from '../actionHandlers/LDSActionHandler';
import { DurableStoreEntry } from '@luvio/environments';

type ScalarFieldType = boolean | number | string | null;
type DraftFields = { [key: string]: ScalarFieldType };

interface ScalarFieldRepresentationValue {
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

// TODO W-8220618 - remove this once generated RecordRepresentation has drafts node on it
export interface DraftRecordRepresentation extends RecordRepresentation {
    drafts?: DraftRepresentation;
}

export interface DurableRecordRepresentation extends Omit<DraftRecordRepresentation, 'fields'> {
    fields: { [key: string]: DurableFieldRepresentation };
    links: { [key: string]: StoreLink };
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
    // TODO: [W-7919614] This method should properly format displayValues for FieldValueRepresentations
    return value === null ? null : value.toString();
}

/**
 * Checks if a node is a GraphNode
 */
function isGraphNode(node: ProxyGraphNode<unknown>): node is GraphNode<unknown> {
    return node !== null && node.type === 'Node';
}

// creates a link node
function createLink(key: string) {
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
}

export interface DraftRecordRepresentationNormalized extends RecordRepresentationNormalized {
    drafts: DraftRepresentation;
}

export function isDraftRecordRepresentationNormalized(
    record: RecordRepresentationNormalized
): record is DraftRecordRepresentationNormalized {
    return (record as any).drafts !== undefined;
}

/**
 * Builds synthetic FieldValueRepresentations for fields that have draft changes applied
 * @param fields List of draft record fields
 */
export function buildRecordFieldValueRepresentationsFromDraftFields(fields: DraftFields) {
    const keys = ObjectKeys(fields);
    const recordFields: { [key: string]: ScalarFieldRepresentationValue } = {};
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const draftField = fields[key];
        recordFields[key] = {
            value: draftField,
            displayValue: formatDisplayValue(draftField),
        };
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
    userId: string
): DurableRecordRepresentation {
    const { timestamp, data, targetId: recordId, tag: recordKey, id: actionId } = action;
    const { body } = data;
    const { apiName } = body;

    const fields = buildRecordFieldValueRepresentationsFromDraftFields(body.fields);

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
 * Looks up the apiName for a RecordRepresentation located in the Store
 * @param key RecordRepresentation key
 * @param env The environment containing the Store where the record is stored
 */
export function extractRecordApiNameFromStore(key: string, env: Environment): string | undefined {
    const node = env.getNode<RecordRepresentationNormalized>(key);
    if (isGraphNode(node)) {
        const record = node.retrieve();
        return record.apiName;
    }
    return undefined;
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
        const syntheticRecord = buildSyntheticRecordRepresentation(postAction, userId);
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
        };
    } else {
        record.drafts.draftActionIds = [...record.drafts.draftActionIds, draft.id];
    }

    if (method === 'delete') {
        if (drafts.length > 0) {
            throw Error('cannot contain drafts after a terminal delete');
        }
        record.drafts.deleted = true;
        return record;
    }

    const fields = draft.data.body.fields;
    const draftFields = buildRecordFieldValueRepresentationsFromDraftFields(fields);

    const fieldNames = ObjectKeys(draftFields);
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        if (objectInfo !== undefined) {
            const fieldInfo = objectInfo.fields[fieldName];

            if (fieldInfo !== undefined) {
                const { dataType, relationshipName } = fieldInfo;
                if (dataType === 'Reference' && relationshipName !== null) {
                    const fieldValue = draftFields[fieldName].value;

                    if (typeof fieldValue !== 'string') {
                        throw Error('reference field value is not a string');
                    }

                    const key = keyBuilderRecord({ recordId: fieldValue });
                    record.fields[relationshipName] = {
                        displayValue: null,
                        value: createLink(key),
                    };
                }
            }
        }

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

export function isStoreRecordError(storeRecord: unknown): storeRecord is StoreRecordError {
    return (storeRecord as StoreRecordError).__type === 'error';
}

export function isEntryDurableRecordRepresentation(
    entry: DurableStoreEntry<any>,
    key: string
): entry is DurableStoreEntry<DurableRecordRepresentation> {
    return isStoreKeyRecordId(key) && entry.data.apiName !== undefined;
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
                const queueActionKey = buildDraftDurableStoreKey(queueActionTag, queueActionId);
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
                        key: queueActionKey,
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
                        key: queueActionKey,
                        action: updatedAction,
                    });
                }
            }
        }
    }

    return queueOperations;
}

/**
 * Extracts the draft id from the action and the canonical id from the response containing a RecordRepresentation
 * and returns a mapping entry
 * @param action the completed action containing the request and response
 */
export function createIdDraftMapping(
    action: CompletedDraftAction<unknown, unknown>
): DraftIdMappingEntry {
    const { response } = action as CompletedDraftAction<RecordRepresentation, unknown>;
    const draftKey = action.tag;
    const { id } = response.body;
    if (id === undefined) {
        throw Error('Could not find record id in the response');
    }
    const canonicalKey = keyBuilderRecord({ recordId: id });

    const entry: DraftIdMappingEntry = {
        draftKey,
        canonicalKey,
    };

    return entry;
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
 * Merges an existing durable store with an incoming one
 * @param existing Existing record in the durable store
 * @param incoming Incoming record being written to the durable store
 * @param drafts ordered drafts associated with the record
 * @param refreshRecordByFields function to refresh a record by fields
 * @returns
 */
export function durableMerge(
    existing: DurableStoreEntry<DurableRecordRepresentation>,
    incoming: DurableStoreEntry<DurableRecordRepresentation>,
    drafts: DraftAction<RecordRepresentation, ResourceRequest>[],
    objectInfo: ObjectInfoRepresentation | undefined,
    userId: string,
    getRecord: Adapter<GetRecordConfig, RecordRepresentation>
): DurableStoreEntry<DurableRecordRepresentation> {
    const { data: existingRecord } = existing;
    const { data: incomingRecord } = incoming;

    const existingWithoutDrafts = removeDrafts(existingRecord);
    const incomingWithoutDrafts = removeDrafts(incomingRecord);

    // merged will be undefined if we're dealing with a draft-create
    let merged: DurableRecordRepresentation | undefined;
    if (existingWithoutDrafts !== undefined && incomingWithoutDrafts !== undefined) {
        merged = merge(existingWithoutDrafts, incomingWithoutDrafts, getRecord);
    }

    const mergedWithDrafts = replayDraftsOnRecord(merged, drafts, objectInfo, userId);

    return { data: mergedWithDrafts, expiration: incoming.expiration };
}

function merge(
    existing: DurableRecordRepresentation,
    incoming: DurableRecordRepresentation,
    getRecord: Adapter<GetRecordConfig, RecordRepresentation>
) {
    const incomingWeakEtag = incoming.weakEtag;
    const existingWeakEtag = existing.weakEtag;

    if (incomingWeakEtag !== 0 && existingWeakEtag !== 0 && incomingWeakEtag !== existingWeakEtag) {
        return mergeRecordConflict(existing, incoming, getRecord);
    }

    const merged = {
        ...incoming,
        fields: { ...incoming.fields, ...existing.fields },
        links: { ...incoming.links, ...existing.links },
    };

    return merged;
}

/**
 * Resolves a conflict of an incoming and existing record in the durable store by keeping
 * the newer version, applying drafts (if applicable) and kicking off a refresh of the unionized fields
 * between the two records
 * @param existing Existing durable store record
 * @param incoming Incoming durable store record
 * @param refreshRecordByFields Function to kick of a refresh of a record by fields
 * @returns
 */
function mergeRecordConflict(
    existing: DurableRecordRepresentation,
    incoming: DurableRecordRepresentation,
    getRecord: Adapter<GetRecordConfig, RecordRepresentation>
) {
    const incomingWeakEtag = incoming.weakEtag;
    const existingWeakEtag = existing.weakEtag;

    const existingFields = {};
    const incomingFields = {};
    const unionizedFieldSet = {};
    extractFields(existing, existingFields);
    extractFields(incoming, incomingFields);
    ObjectAssign(unionizedFieldSet, incomingFields, existingFields);
    const unionizedFieldArray = ObjectKeys(unionizedFieldSet);

    // incoming newer, apply drafts (if applicable) and kick of network refresh for unioned fields
    if (existingWeakEtag < incomingWeakEtag) {
        if (isSuperset(incomingFields, existingFields) === false) {
            // kick off a getRecord call which will pull all unionized fields with the same version
            getRecord({ recordId: incoming.id, optionalFields: unionizedFieldArray });
        }
        return incoming;
    }

    // existing newer, refresh with unioned fields
    if (isSuperset(existingFields, incomingFields) === false) {
        // kick off a getRecord call which will pull all unionized fields with the same version
        getRecord({ recordId: incoming.id, optionalFields: unionizedFieldArray });
    }

    return existing;
}

/**
 * Checks to see if @param {setA} is a superset of @param {setB}
 * @param setA The target superset
 * @param setB The target subset
 * @returns
 */
function isSuperset(setA: Record<string, true>, setB: Record<string, true>) {
    const keys = ObjectKeys(setB);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        if (setA[key] !== true) {
            return false;
        }
    }
    return true;
}

/**
 * Extracts a list of fields from a @see {DurableRecordRepresentation} to a provided map. If the field
 * is a spanning record, it includes the Id field of the nested record
 * @param record
 * @param fieldList
 */
function extractFields(record: DurableRecordRepresentation, fieldList: Record<string, true>) {
    const fieldNames = ObjectKeys(record.fields);
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
