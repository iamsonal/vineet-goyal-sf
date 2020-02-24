import {
    karmaNetworkAdapter,
    lds,
    refresh,
    register,
    store,
    wireService,
} from '@salesforce/lds-karma-config/lds-setup';

import { GetCommunityNavigationMenu } from '@salesforce/lds-adapters-community-navigation-menu';

const getCommunityNavigationMenu = register(lds, wireService, GetCommunityNavigationMenu(lds));

export { getCommunityNavigationMenu, refresh, karmaNetworkAdapter, store };
