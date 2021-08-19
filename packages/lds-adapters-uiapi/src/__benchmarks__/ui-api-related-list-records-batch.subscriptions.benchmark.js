import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestRelatedListRecordsBatch } from '@salesforce/lds-adapters-uiapi';

import mockRelatedListRecordsBatch from './mocks/custom-related-list-records-batch';
import { WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const rejectNetworkAdapter = (_) => Promise.reject(new Error('not implemented'));

function clone(data) {
    return JSON.parse(data);
}

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
    ingestRelatedListRecordsBatch(
        JSON.parse(mockRelatedListRecordsBatch),
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
            ingestRelatedListRecordsBatch(
                clone(mockRelatedListRecordsBatch),
                'relatedListRecordsBatch',
                luvio,
                store,
                TIMESTAMP
            );
        });

        run(() => {
            luvio.storeLookup({
                recordId: 'RelatedListRecordsBatch:CwcCustom00__c::CwcCustom01s__r',
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
            ingestRelatedListRecordsBatch(
                clone(mockRelatedListRecordsBatch),
                'relatedListRecordsBatch',
                luvio,
                store,
                TIMESTAMP
            );

            const snapshot = luvio.storeLookup({
                recordId: 'RelatedListRecordsBatch:CwcCustom00__c::CwcCustom01s__r',
                node: {},
                variables: {},
            });
            const copy = clone(mockRelatedListRecordsBatch);
            copy.results[0].result.listReference.relatedListId = 'CustomObject03__r';
            copy.results[1].result.listReference.relatedListId = 'CustomObject04__r';

            ingestRelatedListRecordsBatch(copy, 'relatedListRecordsBatch', luvio, store, TIMESTAMP);

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
            ingestRelatedListRecordsBatch(
                clone(mockRelatedListRecordsBatch),
                'relatedListRecordsBatch',
                luvio,
                store,
                TIMESTAMP
            );

            const snapshot = luvio.storeLookup({
                recordId: 'RelatedListRecordsBatch:CwcCustom00__c::CwcCustom01s__r',
                node: {},
                variables: {},
            });
            const copy = clone(mockRelatedListRecordsBatch);

            copy.results[0].result.listReference.relatedListId = 'CustomObject03__r';
            copy.results[1].result.listReference.relatedListId = 'CustomObject04__r';

            ingestRelatedListRecordsBatch(copy, 'relatedListRecordsBatch', luvio, store, TIMESTAMP);

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
            ingestRelatedListRecordsBatch(
                clone(mockRelatedListRecordsBatch),
                'relatedListRecordsBatch',
                luvio,
                store,
                TIMESTAMP
            );

            const snapshot = luvio.storeLookup({
                recordId: 'RelatedListRecordsBatch:CwcCustom00__c::CwcCustom01s__r',
                node: {},
                variables: {},
            });
            const copy = clone(mockRelatedListRecordsBatch);
            copy.results[0].result.listReference.relatedListId = 'CustomObject03__r';
            copy.results[1].result.listReference.relatedListId = 'CustomObject04__r';

            ingestRelatedListRecordsBatch(copy, 'relatedListRecordsBatch', luvio, store, TIMESTAMP);

            for (let i = 0; i < 100; i += 1) {
                store.subscribe(snapshot, () => {});
            }
        });

        run(() => {
            luvio.storeBroadcast();
        });
    });
});
