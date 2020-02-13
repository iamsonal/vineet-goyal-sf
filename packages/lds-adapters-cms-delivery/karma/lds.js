import {
    karmaNetworkAdapter,
    lds,
    refresh,
    register,
    store,
    wireService,
} from '@salesforce/lds-karma-config/lds-setup';

import {
    getDeliveryChannels as GetDeliveryChannels,
    listContent as ListContent,
} from '@salesforce/lds-adapters-cms-delivery';

const getDeliveryChannels = register(lds, wireService, GetDeliveryChannels(lds));
const listContent = register(lds, wireService, ListContent(lds));

export {
    getDeliveryChannels,
    listContent,
    // lds
    refresh,
    karmaNetworkAdapter,
    store,
};
