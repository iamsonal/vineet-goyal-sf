import {
    karmaNetworkAdapter,
    ldsNative,
    hasPendingNativeCalls,
} from '@salesforce/lds-karma-config/ldsNativeProxy-setup';

import { GetObjectInfo_Native } from '@salesforce/lds-adapters-uiapi';

const getObjectInfo = ldsNative.register(GetObjectInfo_Native);

export {
    // adapters
    getObjectInfo,
    // lds
    karmaNetworkAdapter,
    hasPendingNativeCalls,
};
