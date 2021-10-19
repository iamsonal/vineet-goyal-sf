import { mockNimbusNetworkAdapter } from './mocks/mockNimbusNetwork';
import { DictionaryBackingStore } from './mocks/mockNimbusDurableStore';
import { JsNimbusDurableStore } from '@mobileplatform/nimbus-plugin-lds';

var mockDurableStore = new JsNimbusDurableStore(new DictionaryBackingStore());

// setup the mocks in __nimbus global
global.__nimbus = {
    plugins: {
        LdsDurableStore: mockDurableStore,
        LdsNetworkAdapter: mockNimbusNetworkAdapter,
    },
};

// On core the unstable adapters are re-exported with different names,
// we want to match them here.
jest.mock('@salesforce/lds-adapters-uiapi/sfdc', () => {
    // this list should match what is re-exported from lightning-components repo
    // NOTE: you do not need to list "_imperative" adapters here as the for loop
    // below takes care of those
    const nonImperativeUnstableAdapters = [
        // https://github.com/rax-it/lightning-components/blob/master/ui-lightning-components/src/main/modules/interop/unstable_uiRecordApi/unstable_uiRecordApi.js
        'getRecords',
        'getRecordTemplateClone',
        'getRecordTemplateCreate',

        // https://github.com/rax-it/lightning-components/blob/master/ui-lightning-components/src/main/modules/interop/unstable_uiRelatedListApi/unstable_uiRelatedListApi.js
        'getRelatedListsCount',
        'getRelatedListActions',
        'getRelatedListInfoBatch',
        'getRelatedListRecordsBatch',
        'updateRelatedListInfo',
        'refresh',
    ];

    const actual = jest.requireActual('@salesforce/lds-adapters-uiapi/sfdc');

    // loop through the actual exports and add them with proper names
    const keys = Object.keys(actual);
    const returnModule = {};
    for (const key of keys) {
        // for now all imperative exports are prefixed with "unstable_" in the lightning-components repo
        if (key.endsWith('_imperative')) {
            returnModule[`unstable_${key}`] = actual[key];
            continue;
        }

        if (nonImperativeUnstableAdapters.includes(key)) {
            returnModule[`unstable_${key}`] = actual[key];
            continue;
        }

        returnModule[key] = actual[key];
    }

    return returnModule;
});

beforeEach((done) => {
    // clear durable store
    mockDurableStore.resetStore();

    import('@salesforce/lds-runtime-mobile').then((exports) => {
        // clear in-memory store
        exports.luvio.environment.storeReset();
        done();
    });
});
