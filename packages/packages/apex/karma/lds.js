import {
    karmaNetworkAdapter,
    lds,
    refresh,
    register,
    store,
    wireService,
} from '@salesforce-lds-api/karma-config/lds-setup';

import { GenerateGetApexWireAdapter, GetApexInvoker } from '@salesforce-lds-api/apex';

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
    // lds
    karmaNetworkAdapter,
    store,
};
