import {
    karmaNetworkAdapter,
    lds,
    refresh,
    register,
    store,
    wireService,
} from '@salesforce/lds-karma-config/lds-setup';

import {
    GenerateGetApexWireAdapter,
    GetApexInvoker,
    getSObjectValue,
} from '@salesforce/lds-adapters-apex';

const apexContactControllerGetContactListWireAdapterIdentifier = GetApexInvoker(lds, {
    namespace: '',
    classname: 'ContactController',
    method: 'getContactList',
    isContinuation: false,
});
const apexContactControllerGetContactListWireAdapter = GenerateGetApexWireAdapter(lds, {
    namespace: '',
    classname: 'ContactController',
    method: 'getContactList',
    isContinuation: false,
});

const apex = {
    refreshApex: refresh,
};

const apexContactControllerGetContactList = register(
    lds,
    wireService,
    apexContactControllerGetContactListWireAdapter,
    apexContactControllerGetContactListWireAdapterIdentifier
);

export {
    // adapters
    apex,
    apexContactControllerGetContactList,
    getSObjectValue,
    // lds
    karmaNetworkAdapter,
    store,
};
