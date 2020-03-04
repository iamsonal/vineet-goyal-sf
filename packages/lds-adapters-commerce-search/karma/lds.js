import {
    karmaNetworkAdapter,
    lds,
    refresh,
    register,
    store,
    wireService,
} from '@salesforce/lds-karma-config/lds-setup';

import { ProductSearch } from '@salesforce/lds-adapters-commerce-search';

const productSearch = register(lds, wireService, ProductSearch(lds));

export { productSearch, refresh, karmaNetworkAdapter, store };
