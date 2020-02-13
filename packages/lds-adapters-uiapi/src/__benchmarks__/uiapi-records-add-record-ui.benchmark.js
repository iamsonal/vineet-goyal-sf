import { LDS, Store } from '@ldsjs/engine';
import { ingestRecordUi } from '@salesforce/lds-adapters-uiapi';

import mockRecordUI from './mocks/custom-proto-medium-record-ui';
import { ITERATION_COUNT, WARM_UP_ITERATION_COUNT } from './shared';

const RECORD_ID = 'recordId';
const rejectNetworkAdapter = _ => Promise.reject(new Error('not implemented'));

// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const lds = new LDS(store, rejectNetworkAdapter);
    const data = JSON.parse(mockRecordUI);
    ingestRecordUi(data, RECORD_ID, lds, store);
}

describe('addRecordUi tests', () => {
    benchmark('addRecordUi with identical record ui', () => {
        let i = ITERATION_COUNT;
        let lds;
        let store;

        const data = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockRecordUI));
        const next = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockRecordUI));

        before(() => {
            i--;
            store = new Store();
            lds = new LDS(store, rejectNetworkAdapter);
            ingestRecordUi(data[i], RECORD_ID, lds, store);
        });

        run(() => {
            ingestRecordUi(next[i], RECORD_ID, lds, store);
        });
    });

    benchmark('addRecordUi with changed record ui', () => {
        let i = ITERATION_COUNT;
        let lds;
        let store;

        const data = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockRecordUI));
        const next = new Array(ITERATION_COUNT)
            .fill()
            .map(() => JSON.parse(mockRecordUI))
            .map(next => {
                const mockRecordId = Object.keys(next.records)[0];
                const fieldValue = next.records[mockRecordId].fields.Name.value;

                // Reverse the string so that the length is the same while simulating a change in value
                next.records[mockRecordId].fields.Name.value = fieldValue
                    .split('')
                    .reverse()
                    .join('');
                return next;
            });

        before(() => {
            i--;
            store = new Store();
            lds = new LDS(store, rejectNetworkAdapter);
            ingestRecordUi(data[i], RECORD_ID, lds, store);
        });

        run(() => {
            ingestRecordUi(next[i], RECORD_ID, lds, store);
        });
    });
});
