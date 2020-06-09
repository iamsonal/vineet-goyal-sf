import {
    createWireAdapterConstructor,
    karmaNetworkAdapter,
    lds,
    refresh,
    store,
} from '@salesforce/lds-karma-config/lds-setup';

import { GetCommunityNavigationMenu } from '@salesforce/lds-adapters-community-navigation-menu';

const getCommunityNavigationMenu = createWireAdapterConstructor(
    GetCommunityNavigationMenu(lds),
    'getCommunityNavigationMenuConstructor',
    lds
);

export { getCommunityNavigationMenu, refresh, karmaNetworkAdapter, store };
