import { ResourceRequest } from '@luvio/engine';
import { UI_API_BASE_URI } from '../../uiapi-base';

export function generateMockedRecordFields(
    numberOfFields: number,
    customFieldName?: string,
    isLookup?: boolean
): Array<string> {
    const fields: Array<string> = new Array();
    const fieldName =
        customFieldName !== undefined ? customFieldName.replace(/\s+/g, '') : 'CustomField';
    const fieldSuffix = isLookup === true ? '__r' : '__c';

    for (let i = 0; i < numberOfFields; i++) {
        fields.push(`${fieldName}${i}${fieldSuffix}`);
    }

    return fields;
}

export function buildResourceRequest(resourceRequest: Partial<ResourceRequest>): ResourceRequest {
    return {
        method: resourceRequest.method || 'get',
        baseUri: UI_API_BASE_URI,
        basePath: resourceRequest.basePath || '/test',
        body: resourceRequest.body || {},
        queryParams: resourceRequest.queryParams || {},
        urlParams: resourceRequest.urlParams || {},
        headers: resourceRequest.headers || {},
        fulfill: resourceRequest.fulfill || undefined,
    };
}
