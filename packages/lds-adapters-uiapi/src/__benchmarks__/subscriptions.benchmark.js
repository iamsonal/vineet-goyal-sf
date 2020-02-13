import { LDS, Store } from '@ldsjs/engine';
import { ingestRecord } from '@salesforce/lds-adapters-uiapi';

import mockRecord from './mocks/custom-proto-medium-record';
import { WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const rejectNetworkAdapter = _ => Promise.reject(new Error('not implemented'));

function clone(data) {
    return JSON.parse(data);
}

// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const lds = new LDS(store, rejectNetworkAdapter);
    ingestRecord(JSON.parse(mockRecord), 'record', lds, store);
}

describe('O(n) emit time as subscription count(n) grows', () => {
    benchmark('O(n) - single snapshot', () => {
        let lds;
        let store;

        before(() => {
            store = new Store();
            lds = new LDS(store, rejectNetworkAdapter);
            ingestRecord(clone(mockRecord), 'recordId', lds, store, TIMESTAMP);
        });

        run(() => {
            store.lookup({
                recordId: 'RecordRepresentation:aJGx00000000001GAA',
                node: {},
                variables: {},
            });
        });
    });

    benchmark('O(n) - 1 subscription notification when dependency changes', () => {
        let lds;
        let store;

        before(() => {
            store = new Store();
            lds = new LDS(store, rejectNetworkAdapter);
            ingestRecord(clone(mockRecord), 'recordId', lds, store, TIMESTAMP);

            const snapshot = store.lookup({
                recordId: 'RecordRepresentation:aJGx00000000001GAA',
                node: {},
                variables: {},
            });
            const copy = clone(mockRecord);
            copy.apiName = 'asd';

            ingestRecord(copy, 'recordId', lds, store, TIMESTAMP);

            store.subscribe(snapshot, () => {});
        });

        run(() => {
            store.broadcast();
        });
    });

    benchmark('O(n) - 10 subscription notifications when dependency changes', () => {
        let lds;
        let store;

        before(() => {
            store = new Store();
            lds = new LDS(store, rejectNetworkAdapter);
            ingestRecord(clone(mockRecord), 'recordId', lds, store, TIMESTAMP);

            const snapshot = store.lookup({
                recordId: 'RecordRepresentation:aJGx00000000001GAA',
                node: {},
                variables: {},
            });
            const copy = clone(mockRecord);
            copy.apiName = 'asd';

            ingestRecord(copy, 'recordId', lds, store, TIMESTAMP);

            for (let i = 0; i < 10; i += 1) {
                store.subscribe(snapshot, () => {});
            }
        });

        run(() => {
            store.broadcast();
        });
    });

    benchmark('O(n) - 100 subscription notifications when dependency changes', () => {
        let lds;
        let store;

        before(() => {
            store = new Store();
            lds = new LDS(store, rejectNetworkAdapter);
            ingestRecord(clone(mockRecord), 'recordId', lds, store, TIMESTAMP);

            const snapshot = store.lookup({
                recordId: 'RecordRepresentation:aJGx00000000001GAA',
                node: {},
                variables: {},
            });
            const copy = clone(mockRecord);
            copy.apiName = 'asd';

            ingestRecord(copy, 'recordId', lds, store, TIMESTAMP);

            for (let i = 0; i < 100; i += 1) {
                store.subscribe(snapshot, () => {});
            }
        });

        run(() => {
            store.broadcast();
        });
    });
});
