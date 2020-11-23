import { ResourceRequest } from '@luvio/engine';

import { ArrayPrototypePush, JSONParse, JSONStringify, ObjectEntries } from './utils/language';

import { ControllerInvoker } from './middlewares/utils';

import { default as appRouter } from './router';
import './middlewares';

interface RequestHandlers {
    resolve: (response: any) => void;
    reject: (error: Error) => void;
}

function controllerInvokerFactory(resourceRequest: ResourceRequest): ControllerInvoker {
    const { baseUri, basePath, method } = resourceRequest;
    const path = `${baseUri}${basePath}`;

    const ret = appRouter.lookup(resourceRequest);

    if (ret === null) {
        throw new Error(`No invoker matching controller factory: ${path} ${method}.`);
    }

    return ret;
}

interface RequestHandlers {
    resolve: (response: any) => void;
    reject: (error: Error) => void;
    resourceRequest: ResourceRequest;
}
interface InflightRequests {
    [key: string]: RequestHandlers[];
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

function getTransactionKey(resourceRequest: ResourceRequest): string {
    const { baseUri, basePath, queryParams, headers } = resourceRequest;
    const path = `${baseUri}${basePath}`;
    return `${path}::${JSONStringify(headers)}::${queryParams ? JSONStringify(queryParams) : ''}`;
}

const inflightRequests: InflightRequests = Object.create(null);

export default function networkAdapter(resourceRequest: ResourceRequest): Promise<any> {
    const { method } = resourceRequest;

    const transactionKey = getTransactionKey(resourceRequest);
    const controllerInvoker = controllerInvokerFactory(resourceRequest);

    if (method !== 'get') {
        return controllerInvoker(resourceRequest, transactionKey);
    }

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
        return new Promise(resolve => {
            // custom dedupers find similar (not identical) requests. if the similar request fails
            // there's no guarantee the deduped request should fail. thus we re-issue the
            // original request in the case of a failure
            function reissueRequest() {
                resolve(networkAdapter(resourceRequest));
            }
            ArrayPrototypePush.call(inflightRequests[similarTransactionKey], {
                resolve,
                reject: reissueRequest,
                resourceRequest,
            });
        });
    }

    // not a duplicate request so invoke the network
    // when it resolves, clear the queue then invoke queued handlers
    // (must clear the queue first in case handlers re-invoke the network)
    controllerInvoker(resourceRequest, transactionKey).then(
        response => {
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
        error => {
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
