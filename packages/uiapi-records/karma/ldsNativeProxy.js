import {
    karmaNetworkAdapter,
    ldsNative,
    hasPendingNativeCalls,
} from '@salesforce-lds-api/karma-config/ldsNativeProxy-setup';

import { GetObjectInfo_Native } from '@salesforce-lds-api/uiapi-records';

const getObjectInfo = ldsNative.register(GetObjectInfo_Native);

export {
    // adapters
    getObjectInfo,
    // lds
    karmaNetworkAdapter,
    hasPendingNativeCalls,
};
