import {
    karmaNetworkAdapter,
    ldsNative,
    hasPendingNativeCalls,
} from '@salesforce/lds-karma-config/ldsNativeProxy-setup';

import { ProductSearch_Native } from '@salesforce/lds-adapters-commerce-search';

const productSearch = ldsNative.register(ProductSearch_Native);

export {
    // adapters
    productSearch,
    // lds
    karmaNetworkAdapter,
    hasPendingNativeCalls,
};
