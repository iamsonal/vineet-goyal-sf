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

beforeEach((done) => {
    // clear durable store
    mockDurableStore.resetStore();

    import('@salesforce/lds-runtime-mobile').then((exports) => {
        // clear in-memory store
        exports.luvio.environment.storeReset();
        done();
    });
});
