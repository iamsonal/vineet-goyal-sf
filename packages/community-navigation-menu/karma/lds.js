import {
    karmaNetworkAdapter,
    lds,
    refresh,
    register,
    store,
    wireService,
} from '@salesforce-lds-api/karma-config/lds-setup';

import { getCommunityNavigationMenu as GetCommunityNavigationMenu } from '@salesforce-lds-api/community-navigation-menu';

const getCommunityNavigationMenu = register(lds, wireService, GetCommunityNavigationMenu(lds));

export { getCommunityNavigationMenu, refresh, karmaNetworkAdapter, store };
