import {
    karmaNetworkAdapter,
    ldsNative,
    hasPendingNativeCalls,
} from '@salesforce/lds-karma-config/ldsNativeProxy-setup';

import { GetProductPrice_Native } from '@salesforce/lds-adapters-commerce-store-pricing';

const getProductPrice = ldsNative.register(GetProductPrice_Native);

export {
    // adapters
    getProductPrice,
    // lds
    karmaNetworkAdapter,
    hasPendingNativeCalls,
};
