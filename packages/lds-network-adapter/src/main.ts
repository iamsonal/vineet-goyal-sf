import { NetworkAdapter, ResourceRequest } from '@luvio/engine';

export default function platformNetworkAdapter(baseNetworkAdapter: NetworkAdapter): NetworkAdapter {
    return (resourceRequest: ResourceRequest) => {
        return baseNetworkAdapter(resourceRequest);
    };
}
