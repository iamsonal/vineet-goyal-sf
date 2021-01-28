import { HttpStatusCode } from '@luvio/engine';
import {
    FieldValueRepresentation,
    keyBuilderRecord,
    RecordRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { buildRecordFieldStoreKey } from '@salesforce/lds-uiapi-record-utils';

import {
    DraftAction,
    DraftActionStatus,
    ErrorDraftAction,
    CompletedDraftAction,
} from '../DraftQueue';
import { ObjectKeys } from '../utils/language';
import { DurableRecordRepresentation } from '../utils/records';

export const CURRENT_USER_ID = '005x0000000xNhq';
export const DRAFT_RECORD_ID = 'DRAxx000001XL1tAAG';
export const RECORD_ID = '005xx000001XL1tAAG';
export const STORE_KEY_RECORD = `UiApi::RecordRepresentation:${RECORD_ID}`;
export const STORE_KEY_DRAFT_RECORD = `UiApi::RecordRepresentation:${DRAFT_RECORD_ID}`;
export const STORE_KEY_FIELD__NAME = `UiApi::RecordRepresentation:${RECORD_ID}__fields__Name`;
export const DRAFT_STORE_KEY_FIELD__NAME = `UiApi::RecordRepresentation:${DRAFT_RECORD_ID}__fields__Name`;
export const DEFAULT_API_NAME = 'Account';
export const DEFAULT_NAME_FIELD_VALUE = 'Acme';
export const DEFAULT_TIME_STAMP = 12345;

export const NAME_VALUE = {
    displayValue: null,
    value: 'Justin',
};

export function buildDurableRecordRepresentation(
    id: string,
    fields: { [name: string]: FieldValueRepresentation }
) {
    const recordFields: { [name: string]: FieldValueRepresentation } = {};
    const links = {};
    const key = keyBuilderRecord({ recordId: id });

    ObjectKeys(fields).forEach(field => {
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
        fields: recordFields,
        links,
    };

    return record;
}

export function createGetRequest() {
    return {
        baseUri: '/services/data/v52.0',
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
        baseUri: '/services/data/v52.0',
        basePath: `/ui-api/records/${RECORD_ID}`,
        method: 'patch',
        body: {
            fields: {
                Name: DEFAULT_NAME_FIELD_VALUE,
            },
        },
        urlParams: {},
        queryParams: {},
        headers: {},
    };
}

export function createPostRequest() {
    return {
        baseUri: '/services/data/v52.0',
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
    };
}

export function createDeleteRequest() {
    return {
        baseUri: '/services/data/v52.0',
        basePath: `/ui-api/records/${RECORD_ID}`,
        method: 'delete',
        body: {},
        urlParams: {},
        queryParams: {},
        headers: {},
    };
}

export function createEditDraftAction(
    recordId: string,
    recordKey: string,
    nameValue: string = DEFAULT_NAME_FIELD_VALUE,
    timestamp: number = DEFAULT_TIME_STAMP
): DraftAction<RecordRepresentation> {
    return {
        id: new Date().getUTCMilliseconds().toString(),
        status: DraftActionStatus.Pending,
        tag: recordKey,
        timestamp: timestamp,
        request: {
            baseUri: '/services/data/v52.0',
            basePath: `/ui-api/records/${recordId}`,
            method: 'patch',
            body: { fields: { Name: nameValue } },
            urlParams: { recordId: recordId },
            queryParams: {},
            headers: {},
        },
    };
}

export function createPostDraftAction(
    recordKey: string,
    nameValue: string = DEFAULT_NAME_FIELD_VALUE,
    apiName: string = DEFAULT_API_NAME,
    timestamp: number = DEFAULT_TIME_STAMP
): DraftAction<RecordRepresentation> {
    return {
        id: new Date().getUTCMilliseconds().toString(),
        status: DraftActionStatus.Pending,
        tag: recordKey,
        timestamp: timestamp,
        request: {
            baseUri: '/services/data/v52.0',
            basePath: `/ui-api/records`,
            method: 'post',
            body: { fields: { Name: nameValue }, apiName },
            urlParams: {},
            queryParams: {},
            headers: {},
        },
    };
}

export function createDeleteDraftAction(
    recordId: string,
    recordKey: string,
    timestamp: number = DEFAULT_TIME_STAMP
): DraftAction<RecordRepresentation> {
    return {
        id: new Date().getUTCMilliseconds().toString(),
        status: DraftActionStatus.Pending,
        tag: recordKey,
        timestamp: timestamp,
        request: {
            baseUri: '/services/data/v52.0',
            basePath: `/ui-api/records/${recordId}`,
            method: 'delete',
            body: {},
            urlParams: {},
            queryParams: {},
            headers: {},
        },
    };
}

export function createErrorDraftAction(
    recordId: string,
    recordKey: string,
    timestamp: number = DEFAULT_TIME_STAMP
): ErrorDraftAction<RecordRepresentation> {
    return {
        id: new Date().getUTCMilliseconds().toString(),
        status: DraftActionStatus.Error,
        error: 'SOMETHING WENT WRONG',
        tag: recordKey,
        timestamp: timestamp,
        request: {
            baseUri: '/services/data/v52.0',
            basePath: `/ui-api/records/${recordId}`,
            method: 'delete',
            body: {},
            urlParams: {},
            queryParams: {},
            headers: {},
        },
    };
}

export function createCompletedDraftAction(
    recordId: string,
    recordKey: string,
    timestamp: number = DEFAULT_TIME_STAMP
): CompletedDraftAction<RecordRepresentation> {
    return {
        id: Date.now().toString(),
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
        request: {
            baseUri: '/services/data/v52.0',
            basePath: `/ui-api/records/${recordId}`,
            method: 'delete',
            body: {},
            urlParams: {},
            queryParams: {},
            headers: {},
        },
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
    return new Promise(resolve => setImmediate(resolve));
}
export function createUnsupportedRequestDraftAction(
    recordId: string,
    recordKey: string,
    timestamp: number = DEFAULT_TIME_STAMP
): DraftAction<RecordRepresentation> {
    return {
        id: new Date().getUTCMilliseconds().toString(),
        status: DraftActionStatus.Pending,
        tag: recordKey,
        timestamp: timestamp,
        request: {
            baseUri: '/services/data/v52.0',
            basePath: `/ui-api/records/${recordId}`,
            method: 'get',
            body: {},
            urlParams: {},
            queryParams: {},
            headers: {},
        },
    };
}
