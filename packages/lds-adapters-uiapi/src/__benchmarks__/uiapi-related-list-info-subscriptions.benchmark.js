import { LDS, Store, Environment } from '@ldsjs/engine';
import { ingestRelatedListInfo } from '@salesforce/lds-adapters-uiapi';

import mockRelatedListInfo from './mocks/customcwc001s-related-list-info';
import { WARM_UP_ITERATION_COUNT, TIMESTAMP } from './shared';

const rejectNetworkAdapter = _ => Promise.reject(new Error('not implemented'));

function clone(data) {
    return JSON.parse(data);
}

// TODO: Remove warmup once BEST does this internally.
for (let i = 0; i < WARM_UP_ITERATION_COUNT; i++) {
    const store = new Store();
    const lds = new LDS(new Environment(store, rejectNetworkAdapter));
    ingestRelatedListInfo(JSON.parse(mockRelatedListInfo), 'warmupKey', lds, store);
}

describe('O(n) emit time as subscription count(n) grows', () => {
    benchmark('O(n) - single snapshot', () => {
        let lds;
        let store;

        before(() => {
            store = new Store();
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            ingestRelatedListInfo(
                clone(mockRelatedListInfo),
                'relatedListInfo',
                lds,
                store,
                TIMESTAMP
            );
        });

        run(() => {
            store.lookup({
                relatedListInfo: 'RelatedListInfo:CwcCustom00__c::CwcCustom01s__r',
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
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            ingestRelatedListInfo(
                clone(mockRelatedListInfo),
                'relatedListInfo',
                lds,
                store,
                TIMESTAMP
            );

            const snapshot = store.lookup({
                relatedListInfo: 'RelatedListInfo:CwcCustom00__c::CwcCustom01s__r',
                node: {},
                variables: {},
            });
            const copy = clone(mockRelatedListInfo);
            copy.listReference.relatedListId = 'CustomObject02__r';

            ingestRelatedListInfo(copy, 'relatedListInfo', lds, store, TIMESTAMP);

            store.subscribe(snapshot, () => {});
        });

        run(() => {
            store.broadcast();
        });
    });

    benchmark('O(n) - 10 subscription notifications when dependency changes', () => {
        let lds;
        let store;

        before(() => {
            store = new Store();
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            ingestRelatedListInfo(
                clone(mockRelatedListInfo),
                'relatedListInfo',
                lds,
                store,
                TIMESTAMP
            );

            const snapshot = store.lookup({
                relatedListInfo: 'RelatedListInfo:CwcCustom00__c::CwcCustom01s__r',
                node: {},
                variables: {},
            });
            const copy = clone(mockRelatedListInfo);
            copy.listReference.relatedListId = 'CustomObject02__r';

            ingestRelatedListInfo(copy, 'relatedListInfo', lds, store, TIMESTAMP);

            for (let i = 0; i < 10; i += 1) {
                store.subscribe(snapshot, () => {});
            }
        });

        run(() => {
            store.broadcast();
        });
    });

    benchmark('O(n) - 100 subscription notifications when dependency changes', () => {
        let lds;
        let store;

        before(() => {
            store = new Store();
            lds = new LDS(new Environment(store, rejectNetworkAdapter));
            ingestRelatedListInfo(
                clone(mockRelatedListInfo),
                'relatedListInfo',
                lds,
                store,
                TIMESTAMP
            );

            const snapshot = store.lookup({
                relatedListInfo: 'RelatedListInfo:CwcCustom00__c::CwcCustom01s__r',
                node: {},
                variables: {},
            });
            const copy = clone(mockRelatedListInfo);
            copy.listReference.relatedListId = 'CustomObject02__r';

            ingestRelatedListInfo(copy, 'relatedListInfo', lds, store, TIMESTAMP);

            for (let i = 0; i < 100; i += 1) {
                store.subscribe(snapshot, () => {});
            }
        });

        run(() => {
            store.broadcast();
        });
    });
});
