import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestRecord, ingestRecordUi } from '@salesforce/lds-adapters-uiapi';

import mockRecord from './mocks/custom-proto-medium-record';
import mockRecordUI from './mocks/custom-proto-medium-record-ui';
import { WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const DEFAULT_STORE_ID = 'DEFAULT_STORE_ID';
const rejectNetworkAdapter = (_) => Promise.reject(new Error('not implemented'));

function clone(data, iteration) {
    const copy = JSON.parse(data);
    copy.id = `aJ9x00000000001CA${iteration}`;

    Object.keys(copy.fields).forEach((key, index) => {
        const field = copy.fields[key];
        if (field.value && field.value.id) {
            field.value.id = `aJ9x00000000001C${iteration}${index}`;
        }
    });

    return copy;
}

function populate(count, luvio, store) {
    for (let i = 0; i < count; i += 1) {
        const copy = clone(mockRecord);
        ingestRecord(copy, 'recordId', luvio, store, TIMESTAMP);
    }
}

// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
    ingestRecord(JSON.parse(mockRecord), 'record', luvio, store);
    ingestRecordUi(JSON.parse(mockRecordUI), 'record', luvio, store);
}

describe('O(n) ingestion time for n records', () => {
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
                const copy = clone(mockRecord, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRecord(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
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
                const copy = clone(mockRecord, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRecord(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
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
                const copy = clone(mockRecord, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRecord(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
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
                const copy = clone(mockRecord, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < number; i += 1) {
                ingestRecord(next[i], DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
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
            next = clone(mockRecord);
        });

        run(() => {
            ingestRecord(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
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
            next = clone(mockRecord);
        });

        run(() => {
            ingestRecord(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
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
            next = clone(mockRecord);
        });

        run(() => {
            ingestRecord(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
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
            next = clone(mockRecord);
        });

        run(() => {
            ingestRecord(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('O(1) - ingest 1 record when store has 0 records', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            next = clone(mockRecord);
        });

        run(() => {
            ingestRecord(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });
});

function generateUniqueRecordUi(recordUi, iteration) {
    const copy = JSON.parse(recordUi);

    Object.keys(copy.objectInfos).forEach((key, index) => {
        copy.objectInfos[key].apiName = 'API_NAME_' + iteration + '_' + index;
    });

    return copy;
}

describe('O(n*m) ingestion time for n complex objects comprised of m objects (record-ui from 61.6)', () => {
    benchmark('Store has 0, ingest 1', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            next = generateUniqueRecordUi(mockRecordUI, 1);
        });

        run(() => {
            ingestRecordUi(next, DEFAULT_STORE_ID, luvio, store, TIMESTAMP);
        });
    });

    benchmark('Store has 10, ingest 10', () => {
        let luvio;
        let store;
        let next;
        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));

            for (let i = 0; i < 10; i += 1) {
                ingestRecordUi(
                    generateUniqueRecordUi(mockRecordUI, -i),
                    DEFAULT_STORE_ID,
                    luvio,
                    store,
                    TIMESTAMP
                );
            }
            next = [];
            for (let i = 0; i < 10; i += 1) {
                const copy = generateUniqueRecordUi(mockRecordUI, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < 10; i++) {
                ingestRecordUi(next[i], `recordId-${i}`, luvio, store, TIMESTAMP);
            }
        });
    });

    benchmark('Store has 10, ingest 20', () => {
        let luvio;
        let store;
        let next;

        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));

            for (let i = 0; i < 10; i += 1) {
                ingestRecordUi(
                    generateUniqueRecordUi(mockRecordUI, -i),
                    DEFAULT_STORE_ID,
                    luvio,
                    store,
                    TIMESTAMP
                );
            }

            next = [];
            for (let i = 0; i < 20; i += 1) {
                const copy = generateUniqueRecordUi(mockRecordUI, i);
                next.push(copy);
            }
        });

        run(() => {
            for (let i = 0; i < 20; i++) {
                ingestRecordUi(next[i], `recordId-${i}`, luvio, store, TIMESTAMP);
            }
        });
    });
});
