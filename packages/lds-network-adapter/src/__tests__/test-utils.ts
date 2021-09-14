import { ResourceRequest } from '@luvio/engine';

export function buildResourceRequest(resourceRequest: Partial<ResourceRequest>): ResourceRequest {
    return {
        baseUri: resourceRequest.baseUri || '/test',
        basePath: resourceRequest.basePath || '/test',
        method: resourceRequest.method || 'get',
        body: resourceRequest.body || {},
        queryParams: resourceRequest.queryParams || {},
        urlParams: resourceRequest.urlParams || {},
        headers: resourceRequest.headers || {},
    };
}
