import { FetchResponse, NetworkAdapter, ResourceRequest } from '@luvio/engine';
import { ArrayPrototypePush, JSONStringify, JSONParse, ObjectEntries } from './language';

interface RequestHandlers {
    resolve: (response: any) => void;
    reject: (error: Error) => void;
    resourceRequest: ResourceRequest;
}

type InflightRequests = Record<string, RequestHandlers[]>;

const inflightRequests: InflightRequests = Object.create(null);

const TRANSACTION_KEY_SEP = '::';
const EMPTY_STRING = '';

function getTransactionKey(resourceRequest: ResourceRequest): string {
    const { baseUri, basePath, queryParams, headers } = resourceRequest;
    const path = `${baseUri}${basePath}`;
    const querParamsString = queryParams ? JSONStringify(queryParams) : EMPTY_STRING;
    const headersString = JSONStringify(headers);
    return `${path}${TRANSACTION_KEY_SEP}${headersString}${TRANSACTION_KEY_SEP}${querParamsString}`;
}

function getFulfillingRequest(
    inflightRequests: InflightRequests,
    resourceRequest: ResourceRequest
): string | null {
    const { fulfill } = resourceRequest;
    if (fulfill === undefined) {
        return null;
    }

    const handlersMap = ObjectEntries(inflightRequests);
    for (let i = 0, len = handlersMap.length; i < len; i += 1) {
        const [transactionKey, handlers] = handlersMap[i];
        // check fulfillment against only the first handler ([0]) because it's equal or
        // fulfills all subsequent handlers in the array
        const existing = handlers[0].resourceRequest;
        if (fulfill(existing, resourceRequest) === true) {
            return transactionKey;
        }
    }
    return null;
}

function dedupeRequest(
    baseNetworkAdapter: NetworkAdapter,
    resourceRequest: ResourceRequest
): Promise<FetchResponse<any>> {
    const transactionKey = getTransactionKey(resourceRequest);

    // if an identical request is in-flight then queue for its response (do not re-issue the request)
    if (transactionKey in inflightRequests) {
        return new Promise((resolve, reject) => {
            ArrayPrototypePush.call(inflightRequests[transactionKey], {
                resolve,
                reject,
                resourceRequest,
            });
        });
    }

    // fallback to checking a custom deduper to find a similar (but not identical) request
    const similarTransactionKey = getFulfillingRequest(inflightRequests, resourceRequest);
    if (similarTransactionKey !== null) {
        return new Promise((resolve) => {
            // custom dedupers find similar (not identical) requests. if the similar request fails
            // there's no guarantee the deduped request should fail. thus we re-issue the
            // original request in the case of a failure
            ArrayPrototypePush.call(inflightRequests[similarTransactionKey], {
                resolve,
                reject: function reissueRequest() {
                    resolve(baseNetworkAdapter(resourceRequest));
                },
                resourceRequest,
            });
        });
    }

    baseNetworkAdapter(resourceRequest).then(
        (response) => {
            const handlers = inflightRequests[transactionKey];
            delete inflightRequests[transactionKey];
            // handlers mutate responses so must clone the response for each.
            // the first handler is given the original version to avoid an
            // extra clone (particularly when there's only 1 handler).
            for (let i = 1, len = handlers.length; i < len; i++) {
                const handler = handlers[i];
                handler.resolve(JSONParse(JSONStringify(response)));
            }
            handlers[0].resolve(response);
        },
        (error) => {
            const handlers = inflightRequests[transactionKey];
            delete inflightRequests[transactionKey];
            for (let i = 0, len = handlers.length; i < len; i++) {
                const handler = handlers[i];
                handler.reject(error);
            }
        }
    );

    // rely on sync behavior of Promise creation to create the list for handlers
    return new Promise((resolve, reject) => {
        inflightRequests[transactionKey] = [{ resolve, reject, resourceRequest }];
    });
}

export default function platformNetworkAdapter(baseNetworkAdapter: NetworkAdapter): NetworkAdapter {
    return (resourceRequest: ResourceRequest) => {
        const { method } = resourceRequest;
        if (method !== 'get') {
            return baseNetworkAdapter(resourceRequest);
        }

        return dedupeRequest(baseNetworkAdapter, resourceRequest);
    };
}
