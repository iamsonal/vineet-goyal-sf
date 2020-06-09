import {
    createWireAdapterConstructor,
    karmaNetworkAdapter,
    lds,
    refresh,
    store,
} from '@salesforce/lds-karma-config/lds-setup';

import { ProductSearch } from '@salesforce/lds-adapters-commerce-search';

const productSearch = createWireAdapterConstructor(
    ProductSearch(lds),
    'productSearchConstructor',
    lds
);

export { productSearch, refresh, karmaNetworkAdapter, store };
