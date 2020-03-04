import {
    karmaNetworkAdapter,
    ldsNative,
    hasPendingNativeCalls,
} from '@salesforce/lds-karma-config/ldsNativeProxy-setup';

import {
    GetProductCategoryPath_Native,
    GetProduct_Native,
} from '@salesforce/lds-adapters-commerce-catalog';

const getProductCategoryPath = ldsNative.register(GetProductCategoryPath_Native);
const getProduct = ldsNative.register(GetProduct_Native);

export {
    // adapters
    getProductCategoryPath,
    getProduct,
    // lds
    karmaNetworkAdapter,
    hasPendingNativeCalls,
};
