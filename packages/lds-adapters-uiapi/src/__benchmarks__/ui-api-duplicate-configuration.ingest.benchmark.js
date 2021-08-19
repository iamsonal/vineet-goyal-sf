import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestDuplicateConfiguration } from '@salesforce/lds-adapters-uiapi';

import mockDuplicateConfiguration from './mocks/duplicate-configurations-Lead';
import { WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const DEFAULT_STORE_ID = 'DEFAULT_STORE_ID';
const rejectNetworkAdapter = (_) => Promise.reject(new Error('not implemented'));

function clone(data, iteration) {
    const copy = JSON.parse(data);
    copy.etag = `65523e76c2ee4b1a341d1f6d82fded78759{iteration}`;
    copy.apiName = `Lead${iteration}`;
    return copy;
}

function populate(count, luvio, store) {
    for (let i = 0; i < count; i += 1) {
        const copy = clone(mockDuplicateConfiguration, i);
        ingestDuplicateConfiguration(copy, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
    }
}

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
    ingestDuplicateConfiguration(
        JSON.parse(mockDuplicateConfiguration),
        DEFAULT_STORE_ID,
        luvio,
        store
    );
}

describe('O(n) ingestion time for n duplicateConfigurations', () => {
    benchmark('O(n) - ingest 1000 configs when store has 10 configs', () => {
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
                const copy = clone(mockDuplicateConfiguration, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestDuplicateConfiguration(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
            }
        });
    });

    benchmark('O(n) - ingest 100 configs when store has 10 configs', () => {
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
                const copy = clone(mockDuplicateConfiguration, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestDuplicateConfiguration(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
            }
        });
    });

    benchmark('O(n) - ingest 10 configs when store has 10 configs', () => {
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
                const copy = clone(mockDuplicateConfiguration, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestDuplicateConfiguration(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
            }
        });
    });

    benchmark('O(n) - ingest 1 config when store has 10 configs', () => {
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
                const copy = clone(mockDuplicateConfiguration, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestDuplicateConfiguration(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
            }
        });
    });
});

describe('Constant time', () => {
    benchmark('O(1) - ingest 1 config when store has 1000 configs', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(1000, luvio, store);
            next = clone(mockDuplicateConfiguration);
        });

        run(() => {
            ingestDuplicateConfiguration(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 config when store has 100 configs', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(100, luvio, store);
            next = clone(mockDuplicateConfiguration);
        });

        run(() => {
            ingestDuplicateConfiguration(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 config when store has 10 configs', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(10, luvio, store);
            next = clone(mockDuplicateConfiguration);
        });

        run(() => {
            ingestDuplicateConfiguration(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 config when store has 1 config', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(1, luvio, store);
            next = clone(mockDuplicateConfiguration);
        });

        run(() => {
            ingestDuplicateConfiguration(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 config when store has 0 configs', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            next = clone(mockDuplicateConfiguration);
        });

        run(() => {
            ingestDuplicateConfiguration(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });
});
