import type { ResourceRequest } from '@luvio/engine';

import { UI_API_BASE_URI } from '../uiapi-base';

const UIAPI_GET_RELATED_LIST_RECORDS = `${UI_API_BASE_URI}/related-list-records`;
const UIAPI_GET_RELATED_LIST_RECORDS_BATCH = `${UI_API_BASE_URI}/related-list-records/batch`;

// W-10698167: Revert when the POST dedupe is implemented
export function isRelatedListPostRecordsResourceRequest(resourceRequest: ResourceRequest): boolean {
    const { baseUri, basePath } = resourceRequest;
    const path = `${baseUri}${basePath}`;

    return (
        resourceRequest.method.toLowerCase() === 'post' &&
        path.startsWith(UIAPI_GET_RELATED_LIST_RECORDS) &&
        path.startsWith(UIAPI_GET_RELATED_LIST_RECORDS_BATCH) === false
    );
}

// W-10698167: Revert when the POST dedupe is implemented
export function convertPostRelatedListRecordsToGet(
    resourceRequest: ResourceRequest
): ResourceRequest {
    return {
        ...resourceRequest,
        method: 'get',
        body: null,
        queryParams: resourceRequest.body,
    };
}
