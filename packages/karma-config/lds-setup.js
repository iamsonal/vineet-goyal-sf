import sinon from 'sinon';

import { register as wireServiceRegister, ValueChangedEvent } from 'wire-service';

import { LDS, Store, Environment } from '@ldsjs/engine';
import { bindWireRefresh, register, createWireAdapterConstructor } from '@ldsjs/lwc-lds';

const karmaNetworkAdapter = sinon.stub().rejects();
const store = new Store();
const lds = new LDS(new Environment(store, karmaNetworkAdapter));
const refresh = bindWireRefresh(lds);
const wireService = {
    register: wireServiceRegister,
    ValueChangedEvent,
};

export {
    karmaNetworkAdapter,
    lds,
    refresh,
    register,
    store,
    wireService,
    createWireAdapterConstructor,
};
