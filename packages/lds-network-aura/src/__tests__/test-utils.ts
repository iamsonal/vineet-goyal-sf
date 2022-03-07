import { ResourceRequest } from '@luvio/engine';

export function buildResourceRequest(resourceRequest: Partial<ResourceRequest>): ResourceRequest {
    return {
        baseUri: resourceRequest.baseUri || '/test',
        basePath: resourceRequest.basePath || '/test',
        method: resourceRequest.method || 'get',
        body: resourceRequest.body || {},
        queryParams: resourceRequest.queryParams || {},
        urlParams: resourceRequest.urlParams || {},
        key: resourceRequest.key || 'key',
        headers: resourceRequest.headers || {},
        ingest: (() => {}) as any,
    };
}

export const ERROR_RESPONSE = {
    data: {
        statusCode: 400,
        message: 'Invalid request',
    },
};

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
