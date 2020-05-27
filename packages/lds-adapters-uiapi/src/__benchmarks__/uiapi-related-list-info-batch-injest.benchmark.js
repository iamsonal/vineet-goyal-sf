import { LDS, Store, Environment } from '@ldsjs/engine';
import { ingestRelatedListInfoBatch } from '@salesforce/lds-adapters-uiapi';

import mockRelatedListInfoBatch from './mocks/customcwc001s-related-list-info-batch';
import { WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const DEFAULT_STORE_ID = 'DEFAULT_STORE_ID';
const rejectNetworkAdapter = _ => Promise.reject(new Error('not implemented'));

function clone(data, iteration) {
    const copy = JSON.parse(data);
    copy.results.forEach((result, index) => {
        result.result.etag = `655f02a4197521fb9e9fe83d8403${iteration}${index}`;
        result.result.listReference.relatedListId = `Custom${iteration}${index}__r`;
    });
    return copy;
}

function populate(count, lds, store) {
    for (let i = 0; i < count; i += 1) {
        const copy = clone(mockRelatedListInfoBatch);
        ingestRelatedListInfoBatch(copy, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
    }
}

// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const lds = new LDS(new Environment(store, rejectNetworkAdapter));
    ingestRelatedListInfoBatch(JSON.parse(mockRelatedListInfoBatch), DEFAULT_STORE_ID, lds, store);
}

describe('O(n) ingestion time for n relatedListInfo', () => {
    benchmark('O(n) - ingest 1000 records when store has 10 records', () => {
        let lds;
        let store;
        let next;
        const number = 1000;
        before(() => {
            store = new Store();
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            populate(10, lds, store);
            next = [];
            for (let i = 0; i < number; i += 1) {
                const copy = clone(mockRelatedListInfoBatch, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRelatedListInfoBatch(next[i], DEFAULT_STORE_ID, lds, store, TIMESTAMP);
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
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            populate(10, lds, store);
            next = [];
            for (let i = 0; i < number; i += 1) {
                const copy = clone(mockRelatedListInfoBatch, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRelatedListInfoBatch(next[i], DEFAULT_STORE_ID, lds, store, TIMESTAMP);
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
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            populate(10, lds, store);
            next = [];
            for (let i = 0; i < number; i += 1) {
                const copy = clone(mockRelatedListInfoBatch, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRelatedListInfoBatch(next[i], DEFAULT_STORE_ID, lds, store, TIMESTAMP);
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
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            populate(10, lds, store);
            next = [];
            for (let i = 0; i < number; i += 1) {
                const copy = clone(mockRelatedListInfoBatch, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRelatedListInfoBatch(next[i], DEFAULT_STORE_ID, lds, store, TIMESTAMP);
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
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            populate(1000, lds, store);
            next = clone(mockRelatedListInfoBatch);
        });

        run(() => {
            ingestRelatedListInfoBatch(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 100 records', () => {
        let lds;
        let store;
        let next;
        before(() => {
            store = new Store();
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            populate(100, lds, store);
            next = clone(mockRelatedListInfoBatch);
        });

        run(() => {
            ingestRelatedListInfoBatch(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 10 records', () => {
        let lds;
        let store;
        let next;
        before(() => {
            store = new Store();
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            populate(10, lds, store);
            next = clone(mockRelatedListInfoBatch);
        });

        run(() => {
            ingestRelatedListInfoBatch(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 1 record', () => {
        let lds;
        let store;
        let next;
        before(() => {
            store = new Store();
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            populate(1, lds, store);
            next = clone(mockRelatedListInfoBatch);
        });

        run(() => {
            ingestRelatedListInfoBatch(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 0 records', () => {
        let lds;
        let store;
        let next;
        before(() => {
            store = new Store();
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            next = clone(mockRelatedListInfoBatch);
        });

        run(() => {
            ingestRelatedListInfoBatch(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
        });
    });
});
