import {
    karmaNetworkAdapter,
    lds,
    refresh,
    register,
    store,
    wireService,
} from '@salesforce/lds-karma-config/lds-setup';

import { GetProduct, GetProductCategoryPath } from '@salesforce/lds-adapters-commerce-catalog';

const getProduct = register(lds, wireService, GetProduct(lds));
const getProductCategoryPath = register(lds, wireService, GetProductCategoryPath(lds));

export { getProduct, getProductCategoryPath, refresh, karmaNetworkAdapter, store };
