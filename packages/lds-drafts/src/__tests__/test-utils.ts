import {
    FieldValueRepresentation,
    keyBuilderRecord,
    RecordRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { buildRecordFieldStoreKey } from '@salesforce/lds-uiapi-record-utils';

import { DraftAction, DraftActionStatus } from '../DraftQueue';
import { ObjectKeys } from '../utils/language';
import { DurableRecordRepresentation } from '../utils/records';

export const DRAFT_RECORD_ID = 'DRAxx000001XL1tAAG';
export const RECORD_ID = '005xx000001XL1tAAG';
export const STORE_KEY_RECORD = `UiApi::RecordRepresentation:${RECORD_ID}`;
export const STORE_KEY_DRAFT_RECORD = `UiApi::RecordRepresentation:${DRAFT_RECORD_ID}`;
export const STORE_KEY_FIELD__NAME = `UiApi::RecordRepresentation:${RECORD_ID}__fields__Name`;
export const DRAFT_STORE_KEY_FIELD__NAME = `UiApi::RecordRepresentation:${DRAFT_RECORD_ID}__fields__Name`;
export const DEFAULT_API_NAME = 'Account';
export const DEFAULT_NAME_FIELD_VALUE = 'Acme';

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
        apiName: 'Account',
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
        baseUri: '/services/data/v51.0',
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
        baseUri: '/services/data/v51.0',
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
        baseUri: '/services/data/v51.0',
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
        baseUri: '/services/data/v51.0',
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
    nameValue: string = DEFAULT_NAME_FIELD_VALUE
): DraftAction<RecordRepresentation> {
    return {
        id: new Date().getUTCMilliseconds().toString(),
        status: DraftActionStatus.Pending,
        tag: recordKey,
        request: {
            baseUri: '/services/data/v51.0',
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
    apiName: string = 'Account'
): DraftAction<RecordRepresentation> {
    return {
        id: new Date().getUTCMilliseconds().toString(),
        status: DraftActionStatus.Pending,
        tag: recordKey,
        request: {
            baseUri: '/services/data/v51.0',
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
    recordKey: string
): DraftAction<RecordRepresentation> {
    return {
        id: new Date().getUTCMilliseconds().toString(),
        status: DraftActionStatus.Pending,
        tag: recordKey,
        request: {
            baseUri: '/services/data/v51.0',
            basePath: `/ui-api/records/${recordId}`,
            method: 'delete',
            body: {},
            urlParams: {},
            queryParams: {},
            headers: {},
        },
    };
}