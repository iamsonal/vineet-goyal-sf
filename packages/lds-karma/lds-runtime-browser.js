import sinon from 'sinon';
import { LDS, Store, Environment } from '@ldsjs/engine';

const karmaNetworkAdapter = sinon.stub().rejects();

const store = new Store();
const lds = new LDS(new Environment(store, karmaNetworkAdapter));

export { karmaNetworkAdapter, lds, store };
