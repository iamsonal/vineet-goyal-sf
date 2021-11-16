import { FetchResponse, NetworkAdapter, ResourceRequest } from '@luvio/engine';
import { matchRecordsHandlers } from './records';
interface ConnectInJavaError {
    data: {
        errorCode: string;
        message: string;
        statusCode: number;
    };
    id: string;
    message: string;
    stackTrace: string;
}

export interface SalesforceResourceRequest {
    networkAdapter: NetworkAdapter;
    resourceRequest: ResourceRequest;
}

export type Dispatcher = (req: SalesforceResourceRequest) => Promise<FetchResponse<unknown>>;

export const defaultDispatcher: Dispatcher = (
    req: SalesforceResourceRequest
): Promise<FetchResponse<unknown>> => {
    const { networkAdapter, resourceRequest } = req;
    return networkAdapter(resourceRequest).then(null, (err) => {
        // Handle ConnectedInJava exception shapes
        if (err.data !== undefined && err.data.statusCode !== undefined) {
            const { data } = err as ConnectInJavaError;
            const errResp: FetchResponse<unknown> = {
                status: data.statusCode,
                body: data,
                ok: err.ok,
                statusText: err.statusText,
                headers: err.headers,
            };
            throw errResp;
        }

        if (err.status !== undefined) {
            const errResp: FetchResponse<unknown> = {
                status: err.status,
                body: {
                    error: err.message,
                },
                ok: err.ok,
                statusText: err.statusText,
                headers: err.headers,
            };
            throw errResp;
        }

        throw err;
    });
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
