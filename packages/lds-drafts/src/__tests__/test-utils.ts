import { HttpStatusCode, ResourceRequest } from '@luvio/engine';
import { DurableStore } from '@luvio/environments';
import {
    FieldValueRepresentation,
    keyBuilderObjectInfo,
    keyBuilderRecord,
    RecordRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { buildRecordFieldStoreKey } from '@salesforce/lds-uiapi-record-utils';
import { LDS_ACTION_HANDLER_ID } from '../actionHandlers/LDSActionHandler';

import {
    DraftAction,
    DraftActionStatus,
    ErrorDraftAction,
    CompletedDraftAction,
    PendingDraftAction,
} from '../DraftQueue';
import { generateUniqueDraftActionId } from '../DurableDraftQueue';
import { RecordDenormalizingDurableStore } from '../durableStore/makeRecordDenormalizingDurableStore';
import { ObjectKeys } from '../utils/language';
import { DurableRecordRepresentation } from '../utils/records';

export const CURRENT_USER_ID = '005x0000000xNhq';
export const DRAFT_RECORD_ID = 'DRAxx000001XL1tAAG';
export const RECORD_ID = '001xx000003Gn4WAAS';
export const STORE_KEY_RECORD = `UiApi::RecordRepresentation:${RECORD_ID}`;
export const STORE_KEY_DRAFT_RECORD = `UiApi::RecordRepresentation:${DRAFT_RECORD_ID}`;
export const STORE_KEY_FIELD__NAME = `UiApi::RecordRepresentation:${RECORD_ID}__fields__Name`;
export const DRAFT_STORE_KEY_FIELD__NAME = `UiApi::RecordRepresentation:${DRAFT_RECORD_ID}__fields__Name`;
export const ACCOUNT_OBJECT_INFO_KEY = keyBuilderObjectInfo({ apiName: 'Account' });
export const DEFAULT_API_NAME = 'Account';
export const DEFAULT_NAME_FIELD_VALUE = 'Acme';
export const DEFAULT_TIME_STAMP = 12345;

export const DEFAULT_DRAFT_TIMESTAMP_FORMATTED = new Date(DEFAULT_TIME_STAMP).toISOString();

export const NAME_VALUE = {
    displayValue: null,
    value: 'Justin',
};

export function buildMockDurableStore(): DurableStore {
    return {
        setEntries: jest.fn().mockResolvedValue(undefined),
        getEntries: jest.fn(),
        getAllEntries: jest.fn(),
        evictEntries: jest.fn(),
        registerOnChangedListener: jest.fn(),
        batchOperations: jest.fn(),
    };
}

export function buildDurableRecordRepresentation(
    id: string,
    fields: { [name: string]: FieldValueRepresentation }
) {
    const recordFields: { [name: string]: FieldValueRepresentation } = {};
    const links = {};
    const key = keyBuilderRecord({ recordId: id });

    ObjectKeys(fields).forEach((field) => {
        const fieldValue = fields[field];
        recordFields[field] = fieldValue;
        links[field] = { __ref: buildRecordFieldStoreKey(key, field) };
    });
    const record: DurableRecordRepresentation = {
        id,
        apiName: DEFAULT_API_NAME,
        childRelationships: {},
        eTag: '',
        weakEtag: 0,
        lastModifiedById: '',
        lastModifiedDate: '',
        recordTypeId: null,
        recordTypeInfo: null,
        systemModstamp: '',
        fields: recordFields as DurableRecordRepresentation['fields'],
        links,
    };

    return record;
}

export function createGetRequest() {
    return {
        baseUri: '/services/data/v55.0',
        basePath: `/ui-api/records/${RECORD_ID}`,
        method: 'get',
        body: {},
        urlParams: {},
        queryParams: {},
        headers: {},
    };
}

export function createPatchRequest() {
    return {
        baseUri: '/services/data/v55.0',
        basePath: `/ui-api/records/${RECORD_ID}`,
        method: 'patch',
        body: {
            apiName: DEFAULT_API_NAME,
            fields: {
                Name: DEFAULT_NAME_FIELD_VALUE,
            },
        },
        urlParams: {
            recordId: RECORD_ID,
        },
        queryParams: {},
        headers: {},
    };
}

export function createPostRequest(): ResourceRequest {
    return {
        baseUri: '/services/data/v55.0',
        basePath: `/ui-api/records/`,
        method: 'post',
        body: {
            apiName: DEFAULT_API_NAME,
            fields: {
                Name: DEFAULT_NAME_FIELD_VALUE,
            },
        },
        urlParams: {},
        queryParams: {},
        headers: {},
        priority: 'normal',
    };
}

export function createDeleteRequest() {
    return {
        baseUri: '/services/data/v55.0',
        basePath: `/ui-api/records/${RECORD_ID}`,
        method: 'delete',
        body: {},
        urlParams: {},
        queryParams: {},
        headers: {},
    };
}

var createdDraftIds: string[] = [];
export function createEditDraftAction(
    recordId: string,
    recordKey: string,
    nameValue: string = DEFAULT_NAME_FIELD_VALUE,
    timestamp: number = DEFAULT_TIME_STAMP
): PendingDraftAction<RecordRepresentation, ResourceRequest> {
    const newDraftId = generateUniqueDraftActionId(createdDraftIds);
    createdDraftIds.push(newDraftId);
    return {
        id: newDraftId,
        targetId: recordId,
        status: DraftActionStatus.Pending,
        tag: recordKey,
        timestamp: timestamp,
        handler: LDS_ACTION_HANDLER_ID,
        data: {
            baseUri: '/services/data/v55.0',
            basePath: `/ui-api/records/${recordId}`,
            method: 'patch',
            body: { fields: { Name: nameValue } },
            urlParams: { recordId: recordId },
            queryParams: {},
            headers: {},
            priority: 'normal',
        },
        metadata: {},
    };
}

export function createPostDraftAction(
    recordKey: string,
    targetId: string,
    nameValue: string = DEFAULT_NAME_FIELD_VALUE,
    apiName: string = DEFAULT_API_NAME,
    timestamp: number = DEFAULT_TIME_STAMP
): DraftAction<RecordRepresentation, ResourceRequest> {
    const newDraftId = generateUniqueDraftActionId(createdDraftIds);
    createdDraftIds.push(newDraftId);
    return {
        id: newDraftId,
        targetId,
        status: DraftActionStatus.Pending,
        tag: recordKey,
        timestamp: timestamp,
        handler: LDS_ACTION_HANDLER_ID,
        data: {
            baseUri: '/services/data/v55.0',
            basePath: `/ui-api/records`,
            method: 'post',
            body: { fields: { Name: nameValue }, apiName },
            urlParams: {},
            queryParams: {},
            headers: {},
            priority: 'normal',
        },
        metadata: {},
    };
}

export function createDeleteDraftAction(
    recordId: string,
    recordKey: string,
    timestamp: number = DEFAULT_TIME_STAMP
): DraftAction<RecordRepresentation, ResourceRequest> {
    const newDraftId = generateUniqueDraftActionId(createdDraftIds);
    createdDraftIds.push(newDraftId);
    return {
        id: newDraftId,
        targetId: recordId,
        status: DraftActionStatus.Pending,
        tag: recordKey,
        timestamp: timestamp,
        handler: LDS_ACTION_HANDLER_ID,
        data: {
            baseUri: '/services/data/v55.0',
            basePath: `/ui-api/records/${recordId}`,
            method: 'delete',
            body: {},
            urlParams: {},
            queryParams: {},
            headers: {},
            priority: 'normal',
        },
        metadata: {},
    };
}

export function createErrorDraftAction(
    recordId: string,
    recordKey: string,
    timestamp: number = DEFAULT_TIME_STAMP
): ErrorDraftAction<RecordRepresentation, ResourceRequest> {
    const newDraftId = generateUniqueDraftActionId(createdDraftIds);
    createdDraftIds.push(newDraftId);
    return {
        id: newDraftId,
        targetId: recordId,
        status: DraftActionStatus.Error,
        error: {
            status: 400,
            ok: false,
            headers: {},
            statusText: 'SOMETHING WENT WRONG',
            body: { foo: 'bar', one: ['two'] },
        },
        tag: recordKey,
        timestamp: timestamp,
        handler: LDS_ACTION_HANDLER_ID,
        data: {
            baseUri: '/services/data/v55.0',
            basePath: `/ui-api/records/${recordId}`,
            method: 'delete',
            body: {},
            urlParams: {},
            queryParams: {},
            headers: {},
            priority: 'normal',
        },
        metadata: {},
    };
}

export function createCompletedDraftAction(
    recordId: string,
    recordKey: string,
    timestamp: number = DEFAULT_TIME_STAMP
): CompletedDraftAction<RecordRepresentation, ResourceRequest> {
    const newDraftId = generateUniqueDraftActionId(createdDraftIds);
    createdDraftIds.push(newDraftId);
    return {
        id: newDraftId,
        targetId: recordId,
        status: DraftActionStatus.Completed,
        response: {
            status: HttpStatusCode.Ok,
            body: createTestRecord(recordId, recordId, recordId, 1),
            statusText: '',
            ok: true,
            headers: {},
        },
        tag: recordKey,
        timestamp: timestamp,
        handler: LDS_ACTION_HANDLER_ID,
        data: {
            baseUri: '/services/data/v55.0',
            basePath: `/ui-api/records/${recordId}`,
            method: 'delete',
            body: {},
            urlParams: {},
            queryParams: {},
            headers: {},
            priority: 'normal',
        },
        metadata: {},
    };
}

export function createTestRecord(
    id: string,
    nameValue: string,
    nameDisplayValue: string,
    weakEtag: number
): RecordRepresentation {
    return {
        apiName: DEFAULT_API_NAME,
        childRelationships: {},
        eTag: '7bac4baab876b2a4e32d8e8690135f9d',
        fields: {
            Name: {
                displayValue: nameDisplayValue,
                value: nameValue,
            },
        },
        id: id,
        lastModifiedById: '00530000004tNS4AAM',
        lastModifiedDate: '2019-10-16T11:52:48.000Z',
        recordTypeId: '012000000000000AAA',
        recordTypeInfo: null,
        systemModstamp: '2019-10-21T14:52:51.000Z',
        weakEtag: weakEtag,
    };
}

export function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}
export function createUnsupportedRequestDraftAction(
    recordId: string,
    recordKey: string,
    timestamp: number = DEFAULT_TIME_STAMP
): DraftAction<RecordRepresentation, ResourceRequest> {
    return {
        id: new Date().getUTCMilliseconds().toString(),
        status: DraftActionStatus.Pending,
        tag: recordKey,
        timestamp: timestamp,
        targetId: recordId,
        handler: LDS_ACTION_HANDLER_ID,
        data: {
            baseUri: '/services/data/v55.0',
            basePath: `/ui-api/records/${recordId}`,
            method: 'get',
            body: {},
            urlParams: {},
            queryParams: {},
            headers: {},
            priority: 'normal',
        },
        metadata: {},
    };
}

export function createErrorRequestDraftAction(
    recordId: string,
    recordKey: string,
    timestamp: number = DEFAULT_TIME_STAMP
): ErrorDraftAction<RecordRepresentation, unknown> {
    return {
        id: new Date().getUTCMilliseconds().toString(),
        status: DraftActionStatus.Error,
        tag: recordKey,
        timestamp: timestamp,
        targetId: recordId,
        handler: LDS_ACTION_HANDLER_ID,
        data: undefined,
        metadata: {},
        error: '',
    };
}

export const DEFAULT_DURABLE_STORE_GET_ENTRY = {
    [STORE_KEY_RECORD]: {
        data: {
            apiName: DEFAULT_API_NAME,
            childRelationships: {},
            eTag: '',
            fields: {
                Name: {
                    __ref: STORE_KEY_FIELD__NAME,
                },
            },
            id: RECORD_ID,
            lastModifiedById: null,
            lastModifiedDate: null,
            recordTypeId: null,
            recordTypeInfo: null,
            systemModstamp: null,
            weakEtag: -1,
        },
    },

    [STORE_KEY_FIELD__NAME]: {
        data: {
            displayValue: DEFAULT_NAME_FIELD_VALUE,
            value: DEFAULT_NAME_FIELD_VALUE,
        },
    },
};

export function mockDurableStoreResponse(durableStore: RecordDenormalizingDurableStore) {
    durableStore.getDenormalizedRecord = jest.fn().mockResolvedValue({
        apiName: DEFAULT_API_NAME,
        childRelationships: {},
        eTag: '',
        fields: {
            Name: {
                displayValue: DEFAULT_NAME_FIELD_VALUE,
                value: DEFAULT_NAME_FIELD_VALUE,
            },
        },
        id: RECORD_ID,
        lastModifiedById: null,
        lastModifiedDate: null,
        recordTypeId: null,
        recordTypeInfo: null,
        systemModstamp: null,
        weakEtag: -1,
    });
}

export function mockDurableStoreGetDenormalizedRecordDraft(
    durableStore: RecordDenormalizingDurableStore
) {
    durableStore.getDenormalizedRecord = jest.fn().mockResolvedValue({
        apiName: DEFAULT_API_NAME,
        childRelationships: {},
        eTag: '',
        fields: {
            Name: {
                displayValue: DEFAULT_NAME_FIELD_VALUE,
                value: DEFAULT_NAME_FIELD_VALUE,
            },
        },
        drafts: {
            created: true,
            edited: false,
            deleted: false,
            serverValues: {},
        },
        links: {
            Name: {
                __ref: DRAFT_STORE_KEY_FIELD__NAME,
            },
        },
        id: DRAFT_RECORD_ID,
        lastModifiedById: null,
        lastModifiedDate: null,
        recordTypeId: null,
        recordTypeInfo: null,
        systemModstamp: null,
        weakEtag: -1,
    });
}
