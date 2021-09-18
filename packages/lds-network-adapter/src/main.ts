import { NetworkAdapter, ResourceRequest } from '@luvio/engine';
import { dedupeRequest } from './dispatch/dedupe';
import { getDisaptcher, SalesforceResourceRequest } from './dispatch/main';

export default function platformNetworkAdapter(baseNetworkAdapter: NetworkAdapter): NetworkAdapter {
    return (resourceRequest: ResourceRequest) => {
        const salesforceRequest: SalesforceResourceRequest = {
            networkAdapter: baseNetworkAdapter,
            resourceRequest,
        };
        const { method } = resourceRequest;
        if (method.toLowerCase() !== 'get') {
            const dispatch = getDisaptcher(resourceRequest);
            return dispatch(salesforceRequest);
        }

        return dedupeRequest(salesforceRequest);
    };
}
