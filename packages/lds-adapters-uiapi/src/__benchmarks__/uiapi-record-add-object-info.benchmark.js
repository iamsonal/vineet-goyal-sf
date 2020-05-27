import { LDS, Store, Environment } from '@ldsjs/engine';
import { ingestObjectInfo } from '@salesforce/lds-adapters-uiapi';

import mockObjectInfo from './mocks/custom-proto-medium-object-info';
import { ITERATION_COUNT, WARM_UP_ITERATION_COUNT } from './shared';

const RECORD_ID = 'objectInfo';
const rejectNetworkAdapter = _ => Promise.reject(new Error('not implemented'));

// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const lds = new LDS(new Environment(store, rejectNetworkAdapter));
    const data = JSON.parse(mockObjectInfo);
    ingestObjectInfo(data, RECORD_ID, lds, store);
}

describe('addObjectInfo tests', () => {
    benchmark('addObjectInfo with identical object info', () => {
        let i = ITERATION_COUNT;
        let lds;
        let store;

        const data = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockObjectInfo));
        const next = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockObjectInfo));

        before(() => {
            i--;
            store = new Store();
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            ingestObjectInfo(data[i], RECORD_ID, lds, store);
        });

        run(() => {
            ingestObjectInfo(next[i], RECORD_ID, lds, store);
        });
    });

    benchmark('addObjectInfo with changed object info', () => {
        let i = ITERATION_COUNT;
        let lds;
        let store;

        const data = new Array(ITERATION_COUNT).fill().map(() => JSON.parse(mockObjectInfo));
        const next = new Array(ITERATION_COUNT)
            .fill()
            .map(() => JSON.parse(mockObjectInfo))
            .map(next => {
                return {
                    ...next,
                    eTag: `${next}:updated`,
                };
            });

        before(() => {
            i--;
            store = new Store();
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            ingestObjectInfo(data[i], RECORD_ID, lds, store);
        });

        run(() => {
            ingestObjectInfo(next[i], RECORD_ID, lds, store);
        });
    });
});
