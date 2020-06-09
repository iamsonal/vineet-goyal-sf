import {
    createWireAdapterConstructor,
    karmaNetworkAdapter,
    lds,
    refresh,
    store,
} from '@salesforce/lds-karma-config/lds-setup';

import { GetProductPrice } from '@salesforce/lds-adapters-commerce-store-pricing';

const getProductPrice = createWireAdapterConstructor(
    GetProductPrice(lds),
    'getProductPriceConstructory',
    lds
);

export { getProductPrice, refresh, karmaNetworkAdapter, store };
