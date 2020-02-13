import { LDS, Store } from '@ldsjs/engine';
import { ingestRecord, ingestRecordUi } from '@salesforce/lds-adapters-uiapi';
import mockRecord from '@salesforce/lds-adapters-uiapi/src/__benchmarks__/mocks/custom-proto-medium-record';
import mockRecordUI from '@salesforce/lds-adapters-uiapi/src/__benchmarks__/mocks/custom-proto-medium-record-ui';

const rejectNetworkAdapter = _ => Promise.reject(new Error('not implemented'));
const ITERATION_COUNT = 100;

export default {
    name: 'basic.memory.js',
    maximum: 375000,
    func: () => {
        for (let i = 0; i < ITERATION_COUNT; i++) {
            const store = new Store();
            const lds = new LDS(store, rejectNetworkAdapter);
            ingestRecord(JSON.parse(mockRecord), 'record', lds, store);
            ingestRecordUi(JSON.parse(mockRecordUI), 'record', lds, store);
        }
    },
};
