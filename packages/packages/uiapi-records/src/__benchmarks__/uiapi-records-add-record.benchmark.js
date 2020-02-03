import { LDS, Store } from '@salesforce-lds/engine';
import { ingestRecord } from '@salesforce-lds-api/uiapi-records';

import mockRecord from './mocks/custom-proto-medium-record';
import { ITERATION_COUNT, WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const RECORD_ID = 'recordId';
const rejectNetworkAdapter = _ => Promise.reject(new Error('not implemented'));

// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const lds = new LDS(store, rejectNetworkAdapter);
    const data = JSON.parse(mockRecord);
    ingestRecord(data, RECORD_ID, lds, store);
}

describe('addRecord tests', () => {
    benchmark('addRecord with identical record', () => {
        let i = ITERATION_COUNT;
        let lds;
        let store;

        const data = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockRecord));
        const next = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockRecord));

        before(() => {
            i--;
            store = new Store();
            lds = new LDS(store, rejectNetworkAdapter);
            ingestRecord(data[i], RECORD_ID, lds, store);
        });

        run(() => {
            ingestRecord(next[i], RECORD_ID, lds, store);
        });
    });

    benchmark('addRecord with changed record', () => {
        let i = ITERATION_COUNT;
        let lds;
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
            lds = new LDS(store, rejectNetworkAdapter);
            ingestRecord(data[i], RECORD_ID, lds, store, TIMESTAMP);
        });

        run(() => {
            ingestRecord(next[i], RECORD_ID, lds, store, TIMESTAMP);
        });
    });
});
