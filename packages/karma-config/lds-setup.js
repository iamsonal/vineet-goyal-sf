import sinon from 'sinon';

import { register as registerLwc } from 'lwc';
import {
    register as wireServiceRegister,
    registerWireService,
    ValueChangedEvent,
} from 'wire-service';

import { LDS, Store } from '@ldsjs/engine';
import { bindWireRefresh, register } from '@ldsjs/lwc-lds';

const karmaNetworkAdapter = sinon.stub().rejects();
const store = new Store();
const lds = new LDS(store, karmaNetworkAdapter);
const refresh = bindWireRefresh(lds);
const wireService = {
    register: wireServiceRegister,
    ValueChangedEvent,
};

registerWireService(registerLwc);

export { karmaNetworkAdapter, lds, refresh, register, store, wireService };