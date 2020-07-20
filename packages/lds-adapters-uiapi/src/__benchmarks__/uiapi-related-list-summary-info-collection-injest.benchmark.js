import { LDS, Store, Environment } from '@ldsjs/engine';
import { ingestRelatedListSummaryInfoCollection } from '@salesforce/lds-adapters-uiapi';

import mockRelatedListInfoCollection from './mocks/cwccustom00__c-related-list-info-collection';
import { WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const DEFAULT_STORE_ID = 'DEFAULT_STORE_ID';
const rejectNetworkAdapter = _ => Promise.reject(new Error('not implemented'));

function clone(data, iteration) {
    const copy = JSON.parse(data);
    copy.etag = `655f02a4197521fb9e9fe83d8403${iteration}`;
    copy.parentObjectApiName = `Custom${iteration}__c`;
    return copy;
}

function populate(count, lds, store) {
    for (let i = 0; i < count; i += 1) {
        const copy = clone(mockRelatedListInfoCollection);
        ingestRelatedListSummaryInfoCollection(copy, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
    }
}

// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const lds = new LDS(new Environment(store, rejectNetworkAdapter));
    ingestRelatedListSummaryInfoCollection(
        JSON.parse(mockRelatedListInfoCollection),
        DEFAULT_STORE_ID,
        lds,
        store
    );
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
                const copy = clone(mockRelatedListInfoCollection, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRelatedListSummaryInfoCollection(
                    next[i],
                    DEFAULT_STORE_ID,
                    lds,
                    store,
                    TIMESTAMP
                );
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
                const copy = clone(mockRelatedListInfoCollection, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRelatedListSummaryInfoCollection(
                    next[i],
                    DEFAULT_STORE_ID,
                    lds,
                    store,
                    TIMESTAMP
                );
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
                const copy = clone(mockRelatedListInfoCollection, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRelatedListSummaryInfoCollection(
                    next[i],
                    DEFAULT_STORE_ID,
                    lds,
                    store,
                    TIMESTAMP
                );
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
                const copy = clone(mockRelatedListInfoCollection, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRelatedListSummaryInfoCollection(
                    next[i],
                    DEFAULT_STORE_ID,
                    lds,
                    store,
                    TIMESTAMP
                );
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
            next = clone(mockRelatedListInfoCollection);
        });

        run(() => {
            ingestRelatedListSummaryInfoCollection(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
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
            next = clone(mockRelatedListInfoCollection);
        });

        run(() => {
            ingestRelatedListSummaryInfoCollection(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
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
            next = clone(mockRelatedListInfoCollection);
        });

        run(() => {
            ingestRelatedListSummaryInfoCollection(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
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
            next = clone(mockRelatedListInfoCollection);
        });

        run(() => {
            ingestRelatedListSummaryInfoCollection(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 0 records', () => {
        let lds;
        let store;
        let next;
        before(() => {
            store = new Store();
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            next = clone(mockRelatedListInfoCollection);
        });

        run(() => {
            ingestRelatedListSummaryInfoCollection(next, DEFAULT_STORE_ID, lds, store, TIMESTAMP);
        });
    });
});
