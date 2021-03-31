import { ResourceRequest } from '@luvio/engine';
import { FieldValueRepresentation } from '@salesforce/lds-adapters-uiapi';
export const BASE_URI = '/services/data/v52.0';

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
