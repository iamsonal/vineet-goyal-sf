import {
    karmaNetworkAdapter,
    lds,
    refresh,
    register,
    store,
    wireService,
} from '@salesforce/lds-karma-config/lds-setup';

import { GetProductPrice } from '@salesforce/lds-adapters-commerce-store-pricing';

const getProductPrice = register(lds, wireService, GetProductPrice(lds));

export { getProductPrice, refresh, karmaNetworkAdapter, store };
