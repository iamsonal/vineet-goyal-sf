import {
    karmaNetworkAdapter,
    lds,
    refresh,
    store,
    createWireAdapterConstructor,
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

const apexContactControllerGetContactList = apexContactControllerGetContactListWireAdapterIdentifier;
apexContactControllerGetContactList.adapter = createWireAdapterConstructor(
    apexContactControllerGetContactListWireAdapter,
    'getApex__ContactController_getContactList_false',
    lds
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
