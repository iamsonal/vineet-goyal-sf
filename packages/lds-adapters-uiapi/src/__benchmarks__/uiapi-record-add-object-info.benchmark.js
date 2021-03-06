import { Luvio, Store, Environment } from '@luvio/engine';
import { ingestObjectInfo } from '@salesforce/lds-adapters-uiapi';

import mockObjectInfo from './mocks/custom-proto-medium-object-info';
import { ITERATION_COUNT, WARM_UP_ITERATION_COUNT } from './shared';

const RECORD_ID = 'objectInfo';
const rejectNetworkAdapter = (_) => Promise.reject(new Error('not implemented'));

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
    const data = JSON.parse(mockObjectInfo);
    ingestObjectInfo(data, RECORD_ID, luvio, store);
}

describe('addObjectInfo tests', () => {
    benchmark('addObjectInfo with identical object info', () => {
        let i = ITERATION_COUNT;
        let luvio;
        let store;

        const data = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockObjectInfo));
        const next = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockObjectInfo));

        before(() => {
            i--;
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestObjectInfo(data[i], RECORD_ID, luvio, store);
        });

        run(() => {
            ingestObjectInfo(next[i], RECORD_ID, luvio, store);
        });
    });

    benchmark('addObjectInfo with changed object info', () => {
        let i = ITERATION_COUNT;
        let luvio;
        let store;

        const data = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockObjectInfo));
        const next = new Array(ITERATION_COUNT)
            .fill()
            .map(() => JSON.parse(mockObjectInfo))
            .map((next) => {
                return {
                    ...next,
                    eTag: `${next}:updated`,
                };
            });

        before(() => {
            i--;
            store = new Store();
            luvio = new Luvio(new Environment(store, rejectNetworkAdapter));
            ingestObjectInfo(data[i], RECORD_ID, luvio, store);
        });

        run(() => {
            ingestObjectInfo(next[i], RECORD_ID, luvio, store);
        });
    });
});
