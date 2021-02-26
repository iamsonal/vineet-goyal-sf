import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestRelatedListSummaryInfoCollection } from '@salesforce/lds-adapters-uiapi';

import mockRelatedListInfoCollection from './mocks/cwccustom00__c-related-list-info-collection';
import { WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const rejectNetworkAdapter = _ => Promise.reject(new Error('not implemented'));

function clone(data) {
    return JSON.parse(data);
}

// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
    ingestRelatedListSummaryInfoCollection(
        JSON.parse(mockRelatedListInfoCollection),
        'warmupKey',
        luvio,
        store
    );
}

describe('O(n) emit time as subscription count(n) grows', () => {
    benchmark('O(n) - single snapshot', () => {
        let luvio;
        let store;

        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestRelatedListSummaryInfoCollection(
                clone(mockRelatedListInfoCollection),
                'key',
                luvio,
                store,
                TIMESTAMP
            );
        });

        run(() => {
            luvio.storeLookup({
                recordId: 'key',
                node: {},
                variables: {},
            });
        });
    });

    benchmark('O(n) - 1 subscription notification when dependency changes', () => {
        let luvio;
        let store;

        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestRelatedListSummaryInfoCollection(
                clone(mockRelatedListInfoCollection),
                'key',
                luvio,
                store,
                TIMESTAMP
            );

            const snapshot = luvio.storeLookup({
                recordId: 'key',
                node: {},
                variables: {},
            });
            const copy = clone(mockRelatedListInfoCollection);
            copy.etag = '655f02a4197521fb9e9fe83d8403';

            ingestRelatedListSummaryInfoCollection(copy, 'key', luvio, store, TIMESTAMP);

            store.subscribe(snapshot, () => {});
        });

        run(() => {
            luvio.storeBroadcast();
        });
    });

    benchmark('O(n) - 10 subscription notifications when dependency changes', () => {
        let luvio;
        let store;

        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestRelatedListSummaryInfoCollection(
                clone(mockRelatedListInfoCollection),
                'key',
                luvio,
                store,
                TIMESTAMP
            );

            const snapshot = luvio.storeLookup({
                recordId: 'key',
                node: {},
                variables: {},
            });
            const copy = clone(mockRelatedListInfoCollection);
            copy.etag = '655f02a4197521fb9e9fe83d8403';

            ingestRelatedListSummaryInfoCollection(copy, 'key', luvio, store, TIMESTAMP);

            for (let i = 0; i < 10; i += 1) {
                store.subscribe(snapshot, () => {});
            }
        });

        run(() => {
            luvio.storeBroadcast();
        });
    });

    benchmark('O(n) - 100 subscription notifications when dependency changes', () => {
        let luvio;
        let store;

        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestRelatedListSummaryInfoCollection(
                clone(mockRelatedListInfoCollection),
                'key',
                luvio,
                store,
                TIMESTAMP
            );

            const snapshot = luvio.storeLookup({
                recordId: 'key',
                node: {},
                variables: {},
            });
            const copy = clone(mockRelatedListInfoCollection);
            copy.etag = '655f02a4197521fb9e9fe83d8403';

            ingestRelatedListSummaryInfoCollection(copy, 'key', luvio, store, TIMESTAMP);

            for (let i = 0; i < 100; i += 1) {
                store.subscribe(snapshot, () => {});
            }
        });

        run(() => {
            luvio.storeBroadcast();
        });
    });
});
