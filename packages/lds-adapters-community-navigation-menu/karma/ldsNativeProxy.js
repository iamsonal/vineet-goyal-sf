import {
    karmaNetworkAdapter,
    ldsNative,
    hasPendingNativeCalls,
} from '@salesforce/lds-karma-config/ldsNativeProxy-setup';

import { GetCommunityNavigationMenu_Native } from '@salesforce/lds-adapters-community-navigation-menu';

const getCommunityNavigationMenu = ldsNative.register(GetCommunityNavigationMenu_Native);

export {
    // adapters
    getCommunityNavigationMenu,
    // lds
    karmaNetworkAdapter,
    hasPendingNativeCalls,
};
