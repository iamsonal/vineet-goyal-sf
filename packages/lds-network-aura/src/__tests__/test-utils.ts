import { ResourceRequest } from '@ldsjs/engine';

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
