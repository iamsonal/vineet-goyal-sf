import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestListInfo } from '@salesforce/lds-adapters-uiapi';

import mockListInfo from './mocks/accounts-all-accounts-list-info';
import { WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const DEFAULT_STORE_ID = 'DEFAULT_STORE_ID';
const rejectNetworkAdapter = (_) => Promise.reject(new Error('not implemented'));

function clone(data, iteration) {
    const copy = JSON.parse(data);
    copy.etag = `655f02a4197521fb9e9fe83d8403${iteration}`;
    copy.listReference.listViewApiName = `AllAccounts${iteration}`;

    return copy;
}

function populate(count, luvio, store) {
    for (let i = 0; i < count; i += 1) {
        const copy = clone(mockListInfo);
        ingestListInfo(copy, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
    }
}

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
    ingestListInfo(JSON.parse(mockListInfo), DEFAULT_STORE_ID, luvio, store);
}

describe('O(n) ingestion time for n listInfo', () => {
    benchmark('O(n) - ingest 1000 records when store has 10 records', () => {
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
                const copy = clone(mockListInfo, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestListInfo(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
            }
        });
    });

    benchmark('O(n) - ingest 100 records when store has 10 records', () => {
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
                const copy = clone(mockListInfo, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestListInfo(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
            }
        });
    });

    benchmark('O(n) - ingest 10 records when store has 10 records', () => {
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
                const copy = clone(mockListInfo, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestListInfo(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
            }
        });
    });

    benchmark('O(n) - ingest 1 record when store has 10 records', () => {
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
                const copy = clone(mockListInfo, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestListInfo(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
            }
        });
    });
});

describe('Constant time', () => {
    benchmark('O(1) - ingest 1 record when store has 1000 records', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(1000, luvio, store);
            next = clone(mockListInfo);
        });

        run(() => {
            ingestListInfo(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 100 records', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(100, luvio, store);
            next = clone(mockListInfo);
        });

        run(() => {
            ingestListInfo(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 10 records', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(10, luvio, store);
            next = clone(mockListInfo);
        });

        run(() => {
            ingestListInfo(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 1 record', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            populate(1, luvio, store);
            next = clone(mockListInfo);
        });

        run(() => {
            ingestListInfo(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 0 records', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            next = clone(mockListInfo);
        });

        run(() => {
            ingestListInfo(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });
});
