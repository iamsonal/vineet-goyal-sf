import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestListInfo } from '@salesforce/lds-adapters-uiapi';

import mockListInfo from './mocks/accounts-all-accounts-list-info';
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
    ingestListInfo(JSON.parse(mockListInfo), 'warmupKey', luvio, store);
}

describe('O(n) emit time as subscription count(n) grows', () => {
    benchmark('O(n) - single snapshot', () => {
        let luvio;
        let store;

        before(() => {
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestListInfo(clone(mockListInfo), 'listInfo', luvio, store, TIMESTAMP);
        });

        run(() => {
            luvio.storeLookup({
                recordId: 'UiApi::ListInfoRepresentation:AllAccounts:Account:listView',
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
            ingestListInfo(clone(mockListInfo), 'listInfo', luvio, store, TIMESTAMP);

            const snapshot = luvio.storeLookup({
                recordId: 'UiApi::ListInfoRepresentation:AllAccounts:Account:listView',
                node: {},
                variables: {},
            });

            const copy = clone(mockListInfo);
            copy.listReference.listViewApiName = 'MyAccounts';

            ingestListInfo(copy, 'listInfo', luvio, store, TIMESTAMP);

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
            ingestListInfo(clone(mockListInfo), 'listInfo', luvio, store, TIMESTAMP);

            const snapshot = luvio.storeLookup({
                recordId: 'UiApi::ListInfoRepresentation:AllAccounts:Account:listView',
                node: {},
                variables: {},
            });
            const copy = clone(mockListInfo);
            copy.listReference.listViewApiName = 'MyAccounts';

            ingestListInfo(copy, 'listInfo', luvio, store, TIMESTAMP);

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
            ingestListInfo(clone(mockListInfo), 'listInfo', luvio, store, TIMESTAMP);

            const snapshot = luvio.storeLookup({
                recordId: 'UiApi::ListInfoRepresentation:AllAccounts:Account:listView',
                node: {},
                variables: {},
            });
            const copy = clone(mockListInfo);
            copy.listReference.listViewApiName = 'MyAccounts';

            ingestListInfo(copy, 'listInfo', luvio, store, TIMESTAMP);

            for (let i = 0; i < 100; i += 1) {
                store.subscribe(snapshot, () => {});
            }
        });

        run(() => {
            luvio.storeBroadcast();
        });
    });
});
