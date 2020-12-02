import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestRecord } from '@salesforce/lds-adapters-uiapi';

import mockRecord from './mocks/custom-proto-medium-record';
import { ITERATION_COUNT, WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const RECORD_ID = 'recordId';
const rejectNetworkAdapter = _ => Promise.reject(new Error('not implemented'));

// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
    const data = JSON.parse(mockRecord);
    ingestRecord(data, RECORD_ID, luvio, store);
}

describe('addRecord tests', () => {
    benchmark('addRecord with identical record', () => {
        let i = ITERATION_COUNT;
        let luvio;
        let store;

        const data = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockRecord));
        const next = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockRecord));

        before(() => {
            i--;
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestRecord(data[i], RECORD_ID, luvio, store);
        });

        run(() => {
            ingestRecord(next[i], RECORD_ID, luvio, store);
        });
    });

    benchmark('addRecord with changed record', () => {
        let i = ITERATION_COUNT;
        let luvio;
        let store;

        const data = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockRecord));
        const next = new Array(ITERATION_COUNT)
            .fill()
            .map(() => JSON.parse(mockRecord))
            .map(next => {
                // Reverse the string so that the length is the same while simulating a change in value
                next.fields.Name.value = next.fields.Name.value
                    .split('')
                    .reverse()
                    .join('');
                return next;
            });

        before(() => {
            i--;
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestRecord(data[i], RECORD_ID, luvio, store, TIMESTAMP);
        });

        run(() => {
            ingestRecord(next[i], RECORD_ID, luvio, store, TIMESTAMP);
        });
    });
});
