import type { FetchResponse, NetworkAdapter, ResourceRequest } from '@luvio/engine';
import { matchRecordsHandlers } from './records';

export interface SalesforceResourceRequest {
    networkAdapter: NetworkAdapter;
    resourceRequest: ResourceRequest;
}

export type Dispatcher = (req: SalesforceResourceRequest) => Promise<FetchResponse<unknown>>;

export const defaultDispatcher: Dispatcher = (
    req: SalesforceResourceRequest
): Promise<FetchResponse<unknown>> => {
    const { networkAdapter, resourceRequest } = req;
    return networkAdapter(resourceRequest);
};

export function getDisaptcher(resourceRequest: ResourceRequest): Dispatcher {
    const { basePath, baseUri } = resourceRequest;
    const path = `${baseUri}${basePath}`;
    const recordsMatch = matchRecordsHandlers(path, resourceRequest);
    if (recordsMatch !== null) {
        return recordsMatch;
    }
    return defaultDispatcher;
}
