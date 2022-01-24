import { ResourceRequest } from '@luvio/engine';
import { JSONStringify } from './utils/language';
import './middlewares';
import { ControllerInvoker } from './middlewares/utils';
import { default as appRouter } from './router';
import salesforceNetworkAdapter from '@salesforce/lds-network-adapter';

const TRANSACTION_KEY_SEP = '::';
const EMPTY_STRING = '';

function getTransactionKey(resourceRequest: ResourceRequest): string {
    const { baseUri, basePath, queryParams, headers } = resourceRequest;
    const path = `${baseUri}${basePath}`;
    const queryParamsString = queryParams ? JSONStringify(queryParams) : EMPTY_STRING;
    const headersString = JSONStringify(headers);
    return `${path}${TRANSACTION_KEY_SEP}${headersString}${TRANSACTION_KEY_SEP}${queryParamsString}`;
}

function controllerInvokerFactory(resourceRequest: ResourceRequest): ControllerInvoker {
    const { baseUri, basePath, method } = resourceRequest;
    const path = `${baseUri}${basePath}`;

    const ret = appRouter.lookup(resourceRequest);

    if (ret === null) {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error(`No invoker matching controller factory: ${path} ${method}.`);
        }
    }

    return ret;
}

function auraNetworkAdapter(resourceRequest: ResourceRequest): Promise<any> {
    const transactionKey = getTransactionKey(resourceRequest);
    const controllerInvoker = controllerInvokerFactory(resourceRequest);

    return controllerInvoker(resourceRequest, transactionKey);
}
export default salesforceNetworkAdapter(auraNetworkAdapter);

// Expose module instrumentation
export { instrument, AuraNetworkInstrumentation } from './instrumentation';
