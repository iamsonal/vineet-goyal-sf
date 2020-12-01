import {
    ResourceRequest,
    ProxyGraphNode,
    GraphNode,
    Environment,
    StoreLink,
    StoreRecordError,
} from '@luvio/engine';
import {
    RecordRepresentation,
    keyBuilderRecord,
    FieldValueRepresentation,
    buildSelectionFromFields,
    RecordRepresentationNormalized,
} from '@salesforce/lds-adapters-uiapi';
import { ArrayIsArray, ArrayPrototypeShift, ObjectKeys } from './language';
import { Selector, PathSelection } from '@luvio/engine';
import { DraftAction } from '../main';
import { RecordInputRepresentation } from '@salesforce/lds-adapters-uiapi/dist/types/src/generated/types/RecordInputRepresentation';

type DraftFields = { [key: string]: boolean | number | string | null };

interface ScalarFieldRepresentationValue {
    displayValue: string | null;
    value: RecordInputRepresentation['fields'];
}

const DRAFT_ACTION_KEY_JUNCTION = '__DraftAction__';
const DRAFT_ACTION_KEY_REGEXP = new RegExp(`(.*)${DRAFT_ACTION_KEY_JUNCTION}([a-zA-Z0-9]+)$`);

// TODO W-8220618 - remove this once generated RecordRepresentation has drafts node on it
export interface DraftRecordRepresentation extends RecordRepresentation {
    drafts?: DraftRepresentation;
}

export interface DurableRecordRepresentation extends DraftRecordRepresentation {
    links: { [key: string]: StoreLink };
}

/**
 * Formats the display value for a draft field
 * @param value the value to format
 */
function formatDisplayValue(value: boolean | number | string | null) {
    // TODO: [W-7919614] This method should properly format displayValues for FieldValueRepresentations
    return value?.toString() ?? null;
}

/**
 * Checks if a node is a GraphNode
 */
function isGraphNode(node: ProxyGraphNode<unknown>): node is GraphNode<unknown> {
    return node !== null && node.type === 'Node';
}

const ETAG_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'eTag',
};

const WEAK_ETAG_SELECTION: PathSelection = {
    kind: 'Scalar',
    name: 'weakEtag',
};

export const RECORD_ENDPOINT_REGEX = /^\/ui-api\/records\/?(([a-zA-Z0-9]+))?$/;

export interface DraftRepresentation {
    created: boolean;
    edited: boolean;
    deleted: boolean;
    serverValues: { [fieldName: string]: ScalarFieldRepresentationValue };
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
    const recordFields: { [key: string]: FieldValueRepresentation } = {};
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
 * @param draftId The client-side id representing the record
 * @param apiName The api-name of the record
 * @param userId The user id of the user who created the record
 * @param fields List of fields included in the create request
 */
export function buildSyntheticRecordRepresentation(
    draftId: string,
    apiName: string,
    fields: DraftFields
): RecordRepresentation {
    return {
        id: draftId,
        apiName,
        childRelationships: {},
        eTag: '',
        // TODO: [W-8195422]: Draft created/updated records should have lastModifiedBy set to the logged in user id
        lastModifiedById: null,
        lastModifiedDate: new Date().toISOString(),
        recordTypeId: null,
        recordTypeInfo: null,
        systemModstamp: new Date().toISOString(),
        weakEtag: -1,
        fields: buildRecordFieldValueRepresentationsFromDraftFields(fields),
    };
}

/**
 * Builds a Selector for a record
 * @param recordKey The store key for a record
 * @param fields The list of fields to include in the selector
 */
export function buildRecordSelector(recordKey: string, fields: string[]): Selector {
    return {
        recordId: recordKey,
        node: {
            kind: 'Fragment',
            private: [],
            selections: [...buildSelectionFromFields(fields), ETAG_SELECTION, WEAK_ETAG_SELECTION],
        },
        variables: {},
    };
}

export function shouldDraftResourceRequest(request: ResourceRequest) {
    const { basePath, method } = request;
    return (
        RECORD_ENDPOINT_REGEX.test(basePath) &&
        (method === 'post' || method === 'patch' || method === 'delete')
    );
}

export function isRequestForDraftGetRecord(
    request: ResourceRequest,
    isDraftId: (id: string) => boolean
) {
    const { basePath, method } = request;
    if (RECORD_ENDPOINT_REGEX.test(basePath) && method === 'get') {
        const id = request.urlParams['recordId'];
        return typeof id === 'string' && isDraftId(id);
    }

    return false;
}

/**
 * Extracts a record id from a record ResourceRequest. This method parses out the
 * recordId from the request path in the case of get, update, and delete. In the
 * case of a post, we generate a temporary client-side id
 * @param request The ResourceRequest to extract the record id from
 */
export function getRecordIdFromRecordRequest(
    request: ResourceRequest,
    idGeneratorFunc: (prefix: string) => string
): string | undefined {
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
        case 'post': {
            const apiName = request.body.apiName;
            if (apiName === undefined || apiName === null) {
                return undefined;
            }
            recordId = idGeneratorFunc(apiName);
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

export function getRecordKeyFromRecordRequest(
    resourceRequest: ResourceRequest,
    idGeneratorFunc: (prefix: string) => string
) {
    const id = getRecordIdFromRecordRequest(resourceRequest, idGeneratorFunc);
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
export function getRecordFieldsFromRecordRequest(request: ResourceRequest): string[] | undefined {
    const { method, body } = request;
    if (method === 'patch' || method === 'post') {
        if (body === undefined) {
            return undefined;
        }
        return ObjectKeys(body.fields);
    }

    if (method === 'get') {
        const fieldsParam = request.queryParams['fields'];
        const fields = ArrayIsArray(fieldsParam) ? fieldsParam : [];
        const optionalFieldsParam = request.queryParams['optionalFields'] || [];
        const optionalFields = ArrayIsArray(optionalFieldsParam) ? optionalFieldsParam : [];
        const allFields = [...fields, ...optionalFields] as string[];
        return allFields.map(f => f.substring(f.indexOf('.') + 1));
    }
    return undefined;
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
 * Replays an ordered draft list on top of a record
 * @param record The base record to apply drafts to
 * @param drafts The list of drafts to apply to the record
 */
export function replayDraftsOnRecord<U extends DraftRecordRepresentation>(
    record: U,
    drafts: DraftAction<RecordRepresentation>[]
): U {
    if (drafts.length === 0) {
        return record;
    }
    // remove the next item from the front of the queue
    const draft = ArrayPrototypeShift.call(drafts);
    if (draft === undefined) {
        return record;
    }
    const method = draft.request.method;

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
        };
    }

    if (method === 'delete') {
        if (drafts.length > 0) {
            throw Error('cannot contain drafts after a terminal delete');
        }
        record.drafts.deleted = true;
        return record;
    }

    const fields = draft.request.body.fields;
    const draftFields = buildRecordFieldValueRepresentationsFromDraftFields(fields);

    const keys = ObjectKeys(draftFields);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        if (record.drafts.serverValues[key] === undefined) {
            record.drafts.serverValues[key] = record.fields[key] as any;
        }
        record.fields[key] = draftFields[key];
    }

    record.drafts.edited = true;
    return replayDraftsOnRecord(record, drafts);
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
