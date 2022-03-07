import { FetchResponse, HttpStatusCode, ResourceRequest } from '@luvio/engine';
import {
    FieldValueRepresentation,
    RelatedListRecordCollectionRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { CompositeResponse, CompositeResponseEnvelope, UiApiError } from '../utils';

export const ACCOUNT_ID1 = '001x0000004u7cZAAQ';
export const ACCOUNT_ID2 = '001x0000005u7cZAAQ';
export const CONTACT_ID1 = '003R000000MTvmYIAT';
export const CONTACT_ID2 = '003R000001MTvmYIAT';
export const OPPORTUNITY_ID1 = '006R0000003NGq7IAG';
export const OPPORTUNITY_ID2 = '006R0000004NGq7IAG';
export const ACCOUNT_ID_FIELD_STRING = 'Account.Id';
export const ACCOUNT_NAME_FIELD_STRING = 'Account.Name';
export const CONTACT_ID_FIELD_STRING = 'Contact.Id';
export const CONTACT_NAME_FIELD_STRING = 'Contact.Name';

export const ACCOUNT_INVALID_NAME1 = 'Account.NoName1';
export const ACCOUNT_INVALID_NAME2 = 'Account.NoName2';

export const ACCOUNT1_WITH_ID = wrapFieldsInRecordObject(
    { Id: { displayValue: null, value: ACCOUNT_ID1 } },
    ACCOUNT_ID1
);
export const ACCOUNT1_WITH_NAME = wrapFieldsInRecordObject(
    { Name: { displayValue: 'Costco', value: 'Costco' } },
    ACCOUNT_ID1
);
export const ACCOUNT2_WITH_ID = wrapFieldsInRecordObject(
    { Id: { displayValue: null, value: ACCOUNT_ID2 } },
    ACCOUNT_ID2
);
export const ACCOUNT2_WITH_NAME = wrapFieldsInRecordObject(
    { Name: { displayValue: 'Frys', value: 'Frys' } },
    ACCOUNT_ID2
);
export const UIAPI_ERROR_INVALID_FIELD_NAME1: UiApiError = {
    errorCode: 'INVALID_FIELD',
    message: `no such column ${ACCOUNT_INVALID_NAME1}`,
};
export const UIAPI_ERROR_INVALID_FIELD_NAME2: UiApiError = {
    errorCode: 'INVALID_FIELD',
    message: `no such column ${ACCOUNT_INVALID_NAME2}`,
};

export const BASE_URI = '/services/data/v55.0';

export function generateMockedRecordFields(
    numberOfFields: number,
    customFieldName?: string
): Array<string> {
    const fields: Array<string> = new Array();
    const fieldName =
        customFieldName !== undefined ? customFieldName.replace(/\s+/g, '') : 'CustomField';

    for (let i = 0; i < numberOfFields; i++) {
        fields.push(`${fieldName}${i}__c`);
    }

    return fields;
}

export function generateFetchResponse<T>(
    records: CompositeResponse<T>[]
): FetchResponse<CompositeResponseEnvelope<T>> {
    return {
        status: 200,
        body: {
            compositeResponse: records,
        },
        headers: {},
        ok: true,
        statusText: '',
    };
}

export function buildResourceRequest(resourceRequest: Partial<ResourceRequest>): ResourceRequest {
    return {
        method: resourceRequest.method || 'get',
        baseUri: BASE_URI,
        basePath: resourceRequest.basePath || '/test',
        body: resourceRequest.body || {},
        queryParams: resourceRequest.queryParams || {},
        urlParams: resourceRequest.urlParams || {},
        headers: resourceRequest.headers || {},
        ingest: (() => {}) as any,
        fulfill: resourceRequest.fulfill || undefined,
    };
}

export function verifyRequestBasePath(request: ResourceRequest, expectedBasePath: string) {
    expect(request.basePath).toBe(expectedBasePath);
}

export function wrapFieldsInRecordObject(
    fields: { [key: string]: FieldValueRepresentation },
    id: string = 'oppy'
) {
    return {
        apiName: 'foo',
        childRelationships: {},
        eTag: 'eTag',
        fields: fields,
        id: id,
        systemModstamp: '01-01-1970',
        lastModifiedById: 'user',
        lastModifiedDate: '01-01-1970',
        recordTypeId: 'recordTypeId',
        recordTypeInfo: null,
        weakEtag: 1,
    };
}

export function wrapRecordInCompositeResponse<T>(record: T): CompositeResponse<T> {
    return {
        body: record,
        httpStatusCode: HttpStatusCode.Ok,
    };
}

export function wrapFieldsInRelatedRecordObject(
    fields: {
        [key: string]: FieldValueRepresentation;
    },
    arrays: {
        fields: string[];
        optionalFields: string[];
    },
    parentRecordId: String = ACCOUNT_ID1
): RelatedListRecordCollectionRepresentation {
    const queryFields = arrays.fields.length > 0 ? `fields=${arrays.fields.join(',')}&` : '';
    const queryOptionalFields =
        arrays.optionalFields.length > 0
            ? `optionalFields=${arrays.optionalFields.join(',')}&`
            : '';
    const currentPageUrl = `/services/data/v51.0/ui-api/related-list-records/${parentRecordId}/Contacts?${queryFields}${queryOptionalFields}pageSize=50&pageToken=1`;
    const nextPageUrl = `/services/data/v51.0/ui-api/related-list-records/${parentRecordId}/Contacts?${queryFields}${queryOptionalFields}pageSize=50&pageToken=2`;
    const previousPageUrl = `/services/data/v51.0/ui-api/related-list-records/${parentRecordId}/Contacts?${queryFields}${queryOptionalFields}pageSize=50&pageToken=0`;
    return {
        count: 1,
        currentPageToken: '0',
        currentPageUrl,
        fields: arrays.fields,
        listInfoETag: null,
        listReference: {
            id: null,
            inContextOfRecordId: '001x0000004u7cZAAQ',
            listViewApiName: null,
            objectApiName: null,
            parentObjectApiName: 'Account',
            recordTypeId: null,
            relatedListId: 'Contacts',
            type: 'relatedList',
        },
        nextPageToken: null,
        nextPageUrl,
        optionalFields: arrays.optionalFields,
        pageSize: 50,
        previousPageToken: null,
        previousPageUrl,
        records: [
            {
                apiName: 'Contact',
                childRelationships: {},
                eTag: 'b6c2ae213a152b2e0f6eda2407724b9b',
                fields: fields,
                id: '003RM000006Swh5YAC',
                lastModifiedById: '005RM000001zVSEYA2',
                lastModifiedDate: '2020-12-09T20:08:01.000Z',
                recordTypeId: '012000000000000AAA',
                recordTypeInfo: null,
                systemModstamp: '2020-12-09T20:08:03.000Z',
                weakEtag: 1607544483000,
            },
        ],
        sortBy: [],
    };
}
