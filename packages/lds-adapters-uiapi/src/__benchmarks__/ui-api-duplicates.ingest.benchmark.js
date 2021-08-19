import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestDuplicatesRepresentation } from '@salesforce/lds-adapters-uiapi';

import mockDuplicates from './mocks/duplicates-Lead';
import { WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const DEFAULT_STORE_ID = 'DEFAULT_STORE_ID';
const rejectNetworkAdapter = (_) => Promise.reject(new Error('not implemented'));

function clone(data, iteration) {
    const copy = JSON.parse(data);
    copy.objectApiName = `Lead${iteration}`;
    return copy;
}

function populate(count, luvio, store) {
    for (let i = 0; i < count; i += 1) {
        const copy = clone(mockDuplicates, i);
        ingestDuplicatesRepresentation(copy, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
    }
}

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
    ingestDuplicatesRepresentation(JSON.parse(mockDuplicates), DEFAULT_STORE_ID, luvio, store);
}

describe('O(n) ingestion time for n duplicatesRepresentations', () => {
    benchmark('O(n) - ingest 1000 duplicate results when store has 10 results', () => {
        let luvio;
        let store;
        let next;
        const number = 1000;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(10, luvio, store);
            next = [];
            for (let i = 0; i < number; i += 1) {
                const copy = clone(mockDuplicates, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestDuplicatesRepresentation(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
            }
        });
    });

    benchmark('O(n) - ingest 100 duplicate results when store has 10 results', () => {
        let luvio;
        let store;
        let next;
        const number = 100;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(10, luvio, store);
            next = [];
            for (let i = 0; i < number; i += 1) {
                const copy = clone(mockDuplicates, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestDuplicatesRepresentation(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
            }
        });
    });

    benchmark('O(n) - ingest 10 duplicate results when store has 10 results', () => {
        let luvio;
        let store;
        let next;
        const number = 10;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(10, luvio, store);
            next = [];
            for (let i = 0; i < number; i += 1) {
                const copy = clone(mockDuplicates, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestDuplicatesRepresentation(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
            }
        });
    });

    benchmark('O(n) - ingest 1 duplicate result when store has 10 results', () => {
        let luvio;
        let store;
        let next;
        const number = 1;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(10, luvio, store);
            next = [];
            for (let i = 0; i < number; i += 1) {
                const copy = clone(mockDuplicates, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestDuplicatesRepresentation(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
            }
        });
    });
});

describe('Constant time', () => {
    benchmark('O(1) - ingest 1 duplicate result when store has 1000 duplicate results', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(1000, luvio, store);
            next = clone(mockDuplicates);
        });

        run(() => {
            ingestDuplicatesRepresentation(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 duplicate result when store has 100 results', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(100, luvio, store);
            next = clone(mockDuplicates);
        });

        run(() => {
            ingestDuplicatesRepresentation(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 duplicate result when store has 10 results', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(10, luvio, store);
            next = clone(mockDuplicates);
        });

        run(() => {
            ingestDuplicatesRepresentation(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 duplicate result when store has 1 result', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(1, luvio, store);
            next = clone(mockDuplicates);
        });

        run(() => {
            ingestDuplicatesRepresentation(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 duplicate result when store has 0 results', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            next = clone(mockDuplicates);
        });

        run(() => {
            ingestDuplicatesRepresentation(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });
});
