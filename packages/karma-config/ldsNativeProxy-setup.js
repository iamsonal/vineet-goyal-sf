// TODO: have the test app inject nimbus.js code instead of importing here,
// that way the nimbus js code stays in sync with the nimbus native-side code
import './utils/native/nimbus';

import sinon from 'sinon';

import { register as registerLwc } from 'lwc';
import * as wireService from 'wire-service';
import { LDSNative } from '@salesforce-lds/engine';

const karmaNetworkAdapter = sinon.stub().rejects();
const pendingNativeCalls = new Set();

function hasPendingNativeCalls() {
    return pendingNativeCalls.size > 0;
}

// we need to spy on native proxy calls so we know when we are still
// waiting on outstanding callbacks from the native side
const nativeProxyAdapterSpy = {
    executeAdapter: (uuid, adapterId, adapterConfig, subscribe, callback) => {
        pendingNativeCalls.add(uuid);
        window.LdsProxyAdapter.executeAdapter(
            uuid,
            adapterId,
            adapterConfig,
            subscribe,
            (error, data) => {
                callback(error, data);
                pendingNativeCalls.delete(uuid);
            }
        );
    },
    unsubscribe: uuid => {
        window.LdsProxyAdapter.unsubscribe(uuid);
    },
};
const ldsNative = new LDSNative(wireService, nativeProxyAdapterSpy);

wireService.registerWireService(registerLwc);

// native side needs a mock network adapter on the window object to call
window.bridgedNetworkAdapter = (resourceRequest, _callback) => {
    return karmaNetworkAdapter(resourceRequest);
};

export { karmaNetworkAdapter, ldsNative, hasPendingNativeCalls };
