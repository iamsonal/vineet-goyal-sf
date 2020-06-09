import {
    createWireAdapterConstructor,
    karmaNetworkAdapter,
    lds,
    refresh,
    store,
} from '@salesforce/lds-karma-config/lds-setup';

import { GetProduct, GetProductCategoryPath } from '@salesforce/lds-adapters-commerce-catalog';

const getProduct = createWireAdapterConstructor(GetProduct(lds), 'getProductConstructor', lds);
const getProductCategoryPath = createWireAdapterConstructor(
    GetProductCategoryPath(lds),
    'getProductCategoryPathConstructor',
    lds
);

export { getProduct, getProductCategoryPath, refresh, karmaNetworkAdapter, store };
