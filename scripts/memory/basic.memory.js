import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestRecord, ingestRecordUi } from '@salesforce/lds-adapters-uiapi';
import mockRecord from '@salesforce/lds-adapters-uiapi/src/__benchmarks__/mocks/custom-proto-medium-record';
import mockRecordUI from '@salesforce/lds-adapters-uiapi/src/__benchmarks__/mocks/custom-proto-medium-record-ui';

const rejectNetworkAdapter = (_) => Promise.reject(new Error('not implemented'));
const ITERATION_COUNT = 100;

export default {
    name: 'basic.memory.js',
    maximum: 375000,
    func: () => {
        for (let i = 0; i < ITERATION_COUNT; i++) {
            const store = new Store();
            const luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestRecord(JSON.parse(mockRecord), 'record', luvio, store);
            ingestRecordUi(JSON.parse(mockRecordUI), 'record', luvio, store);
        }
    },
};
