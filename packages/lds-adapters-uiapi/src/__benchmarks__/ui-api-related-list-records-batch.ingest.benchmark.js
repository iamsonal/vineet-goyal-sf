import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestRelatedListRecordsBatch } from '@salesforce/lds-adapters-uiapi';

import mockRelatedListRecordsBatch from './mocks/custom-related-list-records-batch';
import { WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const DEFAULT_STORE_ID = 'DEFAULT_STORE_ID';
const rejectNetworkAdapter = _ => Promise.reject(new Error('not implemented'));

function clone(data, iteration) {
    const copy = JSON.parse(data);
    copy.results[0].result.listReference.relatedListId = `CustomObject${iteration}__r`;
    copy.results[1].result.listReference.relatedListId = `CustomObject${iteration}2__r`;
    return copy;
}

function populate(count, lds, store) {
    for (let i = 0; i < count; i += 1) {
        const copy = clone(mockRelatedListRecordsBatch);
        ingestRelatedListRecordsBatch(copy, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
    }
}

// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
    ingestRelatedListRecordsBatch(
        JSON.parse(mockRelatedListRecordsBatch),
        DEFAULT_STORE_ID,
        luvio,
        store
    );
}

describe('O(n) ingestion time for n relatedListRecords', () => {
    benchmark('O(n) - ingest 1000 records when store has 10 records', () => {
        let lds;
        let store;
        let next;
        const number = 1000;
        before(() => {
            store = new Store();
            lds = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(10, lds, store);
            next = [];
            for (let i = 0; i < number; i += 1) {
                const copy = clone(mockRelatedListRecordsBatch, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRelatedListRecordsBatch(next[i], DEFAULT_STORE_ID, lds, store, TIMESTAMP);
            }
        });
    });

    benchmark('O(n) - ingest 100 records when store has 10 records', () => {
        let lds;
        let store;
        let next;
        const number = 100;
        before(() => {
            store = new Store();
            lds = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(10, lds, store);
            next = [];
            for (let i = 0; i < number; i += 1) {
                const copy = clone(mockRelatedListRecordsBatch, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRelatedListRecordsBatch(next[i], DEFAULT_STORE_ID, lds, store, TIMESTAMP);
            }
        });
    });

    benchmark('O(n) - ingest 10 records when store has 10 records', () => {
        let lds;
        let store;
        let next;
        const number = 10;
        before(() => {
            store = new Store();
            lds = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(10, lds, store);
            next = [];
            for (let i = 0; i < number; i += 1) {
                const copy = clone(mockRelatedListRecordsBatch, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRelatedListRecordsBatch(next[i], DEFAULT_STORE_ID, lds, store, TIMESTAMP);
            }
        });
    });

    benchmark('O(n) - ingest 1 record when store has 10 records', () => {
        let lds;
        let store;
        let next;
        const number = 1;
        before(() => {
            store = new Store();
            lds = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(10, lds, store);
            next = [];
            for (let i = 0; i < number; i += 1) {
                const copy = clone(mockRelatedListRecordsBatch, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRelatedListRecordsBatch(next[i], DEFAULT_STORE_ID, lds, store, TIMESTAMP);
            }
        });
    });
});

describe('Constant time', () => {
    benchmark('O(1) - ingest 1 record when store has 1000 records', () => {
        let lds;
        let store;
        let next;
        before(() => {
            store = new Store();
            lds = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(1000, lds, store);
            next = clone(mockRelatedListRecordsBatch);
        });

        run(() => {
            ingestRelatedListRecordsBatch(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 100 records', () => {
        let lds;
        let store;
        let next;
        before(() => {
            store = new Store();
            lds = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(100, lds, store);
            next = clone(mockRelatedListRecordsBatch);
        });

        run(() => {
            ingestRelatedListRecordsBatch(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 10 records', () => {
        let lds;
        let store;
        let next;
        before(() => {
            store = new Store();
            lds = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(10, lds, store);
            next = clone(mockRelatedListRecordsBatch);
        });

        run(() => {
            ingestRelatedListRecordsBatch(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 1 record', () => {
        let lds;
        let store;
        let next;
        before(() => {
            store = new Store();
            lds = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(1, lds, store);
            next = clone(mockRelatedListRecordsBatch);
        });

        run(() => {
            ingestRelatedListRecordsBatch(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 0 records', () => {
        let lds;
        let store;
        let next;
        before(() => {
            store = new Store();
            lds = new Luvio(new Environment(store, rejectNetworkAdapter));
            next = clone(mockRelatedListRecordsBatch);
        });

        run(() => {
            ingestRelatedListRecordsBatch(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
        });
    });
});
