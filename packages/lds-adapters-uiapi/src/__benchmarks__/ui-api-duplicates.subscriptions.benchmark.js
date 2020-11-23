import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestDuplicatesRepresentation } from '@salesforce/lds-adapters-uiapi';

import mockDuplicates from './mocks/duplicates-Lead';
import { WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const rejectNetworkAdapter = _ => Promise.reject(new Error('not implemented'));

function clone(data) {
    return JSON.parse(data);
}

// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const lds = new Luvio(new Environment(store, rejectNetworkAdapter));
    ingestDuplicatesRepresentation(JSON.parse(mockDuplicates), 'warmupKey', lds, store);
}

describe('O(n) emit time as subscription count(n) grows', () => {
    benchmark('O(n) - single snapshot', () => {
        let lds;
        let store;

        before(() => {
            store = new Store();
            lds = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestDuplicatesRepresentation(clone(mockDuplicates), 'key', lds, store, TIMESTAMP);
        });

        run(() => {
            lds.storeLookup({
                key: 'DuplicatesRepresentation(allowSaveOnDuplicate::apiName:Lead)',
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
            lds = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestDuplicatesRepresentation(clone(mockDuplicates), 'key', lds, store, TIMESTAMP);

            const snapshot = lds.storeLookup({
                key: 'DuplicatesRepresentation(allowSaveOnDuplicate::apiName:Lead)',
                node: {},
                variables: {},
            });
            const copy = clone(mockDuplicates);
            copy.objectApiName = 'Account';

            ingestDuplicatesRepresentation(copy, 'key', lds, store, TIMESTAMP);

            store.subscribe(snapshot, () => {});
        });

        run(() => {
            lds.storeBroadcast();
        });
    });

    benchmark('O(n) - 10 subscription notifications when dependency changes', () => {
        let lds;
        let store;

        before(() => {
            store = new Store();
            lds = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestDuplicatesRepresentation(clone(mockDuplicates), 'key', lds, store, TIMESTAMP);

            const snapshot = lds.storeLookup({
                key: 'DuplicatesRepresentation(allowSaveOnDuplicate::apiName:Lead)',
                node: {},
                variables: {},
            });
            const copy = clone(mockDuplicates);
            copy.objectApiName = 'Account';

            ingestDuplicatesRepresentation(copy, 'key', lds, store, TIMESTAMP);

            for (let i = 0; i < 10; i += 1) {
                store.subscribe(snapshot, () => {});
            }
        });

        run(() => {
            lds.storeBroadcast();
        });
    });

    benchmark('O(n) - 100 subscription notifications when dependency changes', () => {
        let lds;
        let store;

        before(() => {
            store = new Store();
            lds = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestDuplicatesRepresentation(clone(mockDuplicates), 'key', lds, store, TIMESTAMP);

            const snapshot = lds.storeLookup({
                key: 'DuplicatesRepresentation(allowSaveOnDuplicate::apiName:Lead)',
                node: {},
                variables: {},
            });
            const copy = clone(mockDuplicates);
            copy.objectApiName = 'Account';

            ingestDuplicatesRepresentation(copy, 'key', lds, store, TIMESTAMP);

            for (let i = 0; i < 100; i += 1) {
                store.subscribe(snapshot, () => {});
            }
        });

        run(() => {
            lds.storeBroadcast();
        });
    });
});
