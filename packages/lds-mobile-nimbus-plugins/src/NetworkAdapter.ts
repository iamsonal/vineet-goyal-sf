// NOTE: do not remove this import, even though it looks unused it is necessary
// for TS module merging to work properly
import { NimbusPlugins } from 'nimbus-types';
declare module 'nimbus-types' {
    export interface NimbusPlugins {
        LdsNetworkAdapter: NetworkAdapter;
    }
}

/**
 * A `NetworkError` represents a type of transient request error and an associated message
 * if one is available.
 */

export interface NetworkError {
    type: 'timeout' | 'unspecified';
    message: string | null;
}

/**
 * A `NetworkAdapter` is capable of handling `Request`s and generating `Response`s.
 */
export interface NetworkAdapter {
    /**
     * Send the request, returning a token that can be used to cancel the request.
     *
     * @param request the request to handle
     * @param onResponse called when a Response is received
     * @param onError called when there is an error handling the `Request`. The `error`
     * is a NetworkError describing what caused the error.
     * @returns {Promise<string>} A promise resolving to a token for this request
     */
    sendRequest(
        request: Request,
        onResponse: (response: Response) => void,
        onError: (error: NetworkError) => void
    ): Promise<string>;

    /**
     * Attempt to cancel a request associated with the specified token.
     *
     * @param token a token returned from `sendRequest`
     * @returns {void}
     */
    cancelRequest(token: string): void;
}

/**
 * An HTTP request
 */
export interface Request {
    method: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    headers: { [key: string]: string };
    queryParams: { [key: string]: string };
    body: string | null;
}

/**
 * An HTTP response
 */
export interface Response {
    status: number;
    headers: { [key: string]: string };

    /**
     * A string-encoded object or null.
     */
    body: string | null;
}
