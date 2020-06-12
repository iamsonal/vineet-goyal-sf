import sinon from 'sinon';
import { LDS, Store, Environment } from '@ldsjs/engine';
import { bindWireRefresh, createWireAdapterConstructor } from '@ldsjs/lwc-lds';

const karmaNetworkAdapter = sinon.stub().rejects();
const store = new Store();
const lds = new LDS(new Environment(store, karmaNetworkAdapter));
const refresh = bindWireRefresh(lds);

export { karmaNetworkAdapter, lds, refresh, store, createWireAdapterConstructor };
