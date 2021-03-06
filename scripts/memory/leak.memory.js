import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestRecord } from '@salesforce/lds-adapters-uiapi';
import mockRecord from '@salesforce/lds-adapters-uiapi/src/__benchmarks__/mocks/custom-proto-medium-record';

const rejectNetworkAdapter = (_) => Promise.reject(new Error('not implemented'));

function createBigFunction() {
    // Create a function with a lot of data in its closure so we can actually see the memory impact of subscribers
    const data = new Array(1000)
        .fill()
        .map((_) => Math.random())
        .join('');
    return () => data;
}

export default {
    name: 'leak.memory.js',
    maximum: 600000,
    before: () => {
        const store = new Store();
        const luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
        const timestamp = Date.now();
        ingestRecord(JSON.parse(mockRecord), 'recordId', luvio, store, timestamp);
        return { store, luvio, timestamp };
    },
    func: ({ store, luvio, timestamp }) => {
        const snapshot = luvio.storeLookup({
            recordId: 'RecordRepresentation:aJGx00000000001GAA',
            node: {},
            variables: {},
        });

        const unsubscribeFuncs = [];

        for (let i = 0; i < 100; i += 1) {
            unsubscribeFuncs.push(store.subscribe(snapshot, createBigFunction()));
        }

        const modifiedRecord = JSON.parse(mockRecord);
        modifiedRecord.lastModifiedDate = '2018-02-09T06:19:03.000Z'; // change one field

        ingestRecord(modifiedRecord, 'recordId', luvio, store, timestamp);

        for (const unsubscribeFunc of unsubscribeFuncs) {
            unsubscribeFunc();
        }
    },
};
