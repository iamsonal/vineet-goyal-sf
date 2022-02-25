import type { NetworkAdapter, ResourceRequest } from '@luvio/engine';
import { dedupeRequest } from './dispatch/dedupe';
import type { SalesforceResourceRequest } from './dispatch/main';
import { getDisaptcher } from './dispatch/main';
import {
    convertPostRelatedListRecordsToGet,
    isRelatedListPostRecordsResourceRequest,
} from './dispatch/related-lists';
import tokenBucket from './token-bucket';
import { instrumentation } from './instrumentation';

export { instrument } from './instrumentation';

export default function platformNetworkAdapter(baseNetworkAdapter: NetworkAdapter): NetworkAdapter {
    return (resourceRequest: ResourceRequest) => {
        if (!tokenBucket.take(1)) {
            // We are hitting rate limiting, add some metrics
            instrumentation.networkRateLimitExceeded();
        }

        let innerResourceRequest: ResourceRequest;

        // W-10698167: Check if this is a getRelatedListRecords POST
        if (isRelatedListPostRecordsResourceRequest(resourceRequest)) {
            innerResourceRequest = convertPostRelatedListRecordsToGet(resourceRequest);
        } else {
            innerResourceRequest = resourceRequest;
        }

        const salesforceRequest: SalesforceResourceRequest = {
            networkAdapter: baseNetworkAdapter,
            resourceRequest: innerResourceRequest,
        };

        const { method } = salesforceRequest.resourceRequest;

        if (method.toLowerCase() !== 'get') {
            const dispatch = getDisaptcher(resourceRequest);
            return dispatch(salesforceRequest);
        }

        return dedupeRequest(salesforceRequest);
    };
}
