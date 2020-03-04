import {
    karmaNetworkAdapter,
    ldsNative,
    hasPendingNativeCalls,
} from '@salesforce/lds-karma-config/ldsNativeProxy-setup';

import {
    GetDeliveryChannels_Native,
    ListContent_Native,
} from '@salesforce/lds-adapters-cms-delivery';

const getDeliveryChannels = ldsNative.register(GetDeliveryChannels_Native);
const listContent = ldsNative.register(ListContent_Native);

export {
    // adapters
    getDeliveryChannels,
    listContent,
    // lds
    karmaNetworkAdapter,
    hasPendingNativeCalls,
};
