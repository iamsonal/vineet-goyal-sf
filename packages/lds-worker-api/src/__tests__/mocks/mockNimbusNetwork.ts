import { NetworkAdapter, Request, Response, NetworkError } from '@mobileplatform/nimbus-plugin-lds';

// map network request paths to mock responses
const mockNetworkResponses: Map<string, Response | string> = new Map();

function encodeMethodAndPath(method: Request['method'], path: string) {
    return `${method}::${path}`;
}

/**
 * @param {string} path The URL path (for now only path is supported)
 * @param {(Response | string)} response Pass a Response to simulate successful
 * response or a string to simulate an error response
 */
export function addMockNetworkResponse(
    method: Request['method'],
    path: string,
    response: Response | string
) {
    mockNetworkResponses.set(encodeMethodAndPath(method, path), response);
}

export function resetMockNetworkAdapter() {
    mockNetworkResponses.clear();
}

export const mockNimbusNetworkAdapter: NetworkAdapter = {
    sendRequest(
        request: Request,
        onResponse: (response: Response) => void,
        onError: (error: NetworkError) => void
    ): Promise<string> {
        const response = mockNetworkResponses.get(
            encodeMethodAndPath(request.method, request.path)
        );
        if (response === undefined) {
            throw new Error('Test did not setup mock response for that request');
        }

        if (typeof response === 'string') {
            onError({ message: response, type: 'unspecified' });
        } else {
            onResponse(response);
        }

        return Promise.resolve('');
    },

    cancelRequest(_token: string): void {
        // no-op
    },
};
