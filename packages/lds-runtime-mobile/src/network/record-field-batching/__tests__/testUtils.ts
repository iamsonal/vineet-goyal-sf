import { FetchResponse, HttpStatusCode, ResourceRequest } from '@luvio/engine';
import { FieldValueRepresentation } from '@salesforce/lds-adapters-uiapi';
import { CompositeResponse, CompositeResponseEnvelope } from '../utils';
export const BASE_URI = '/services/data/v53.0';

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

export function wrapFieldsInRecordObject(fields: { [key: string]: FieldValueRepresentation }) {
    return {
        apiName: 'foo',
        childRelationships: {},
        eTag: 'eTag',
        fields: fields,
        id: 'oppy',
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
    }
) {
    return {
        count: 1,
        currentPageToken: '0',
        currentPageUrl:
            '/services/data/v51.0/ui-api/related-list-records/001x0000004u7cZAAQ/Contacts?fields=Contact.Id%&optionalFields=Contact.Name&pageSize=50&pageToken=0',
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
        nextPageUrl: null,
        optionalFields: arrays.optionalFields,
        pageSize: 50,
        previousPageToken: null,
        previousPageUrl: null,
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
