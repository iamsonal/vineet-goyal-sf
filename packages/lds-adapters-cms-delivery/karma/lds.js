import {
    createWireAdapterConstructor,
    karmaNetworkAdapter,
    lds,
    refresh,
    store,
} from '@salesforce/lds-karma-config/lds-setup';

import { GetDeliveryChannels, ListContent } from '@salesforce/lds-adapters-cms-delivery';

const getDeliveryChannels = createWireAdapterConstructor(
    GetDeliveryChannels(lds),
    'getDeliveryChannelsConstructor',
    lds
);
const listContent = createWireAdapterConstructor(ListContent(lds), 'listContentConstructor', lds);

export {
    getDeliveryChannels,
    listContent,
    // lds
    refresh,
    karmaNetworkAdapter,
    store,
};
