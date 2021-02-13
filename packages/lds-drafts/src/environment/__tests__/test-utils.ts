import { Environment, Store } from '@luvio/engine';
import { DurableStore, makeDurable } from '@luvio/environments';
import { DraftQueue } from '../../DraftQueue';
import {
    DEFAULT_NAME_FIELD_VALUE,
    RECORD_ID,
    STORE_KEY_FIELD__NAME,
    STORE_KEY_RECORD,
} from '../../__tests__/test-utils';
import { makeEnvironmentDraftAware } from '../makeEnvironmentDraftAware';

export * from '../../__tests__/test-utils';

const DEFAULT_API_NAME = 'Account';

export function setupDraftEnvironment(
    setupOptions: {
        mockNetworkResponse?: any;
    } = {}
) {
    const { mockNetworkResponse } = setupOptions;

    const store = new Store();
    const network = jest.fn().mockResolvedValue(mockNetworkResponse ?? {});
    const durableStore: DurableStore = {
        setEntries: jest.fn(),
        getEntries: jest.fn(),
        getAllEntries: jest.fn(),
        evictEntries: jest.fn(),
        registerOnChangedListener: jest.fn(),
    };
    const draftQueue: DraftQueue = {
        enqueue: jest.fn().mockResolvedValue(undefined),
        getActionsForTags: jest.fn(),
        processNextAction: jest.fn(),
        registerOnChangedListener: jest.fn(),
        getQueueActions: jest.fn(),
        getQueueState: jest.fn(),
        startQueue: jest.fn(),
        stopQueue: jest.fn(),
        removeDraftAction: jest.fn(),
    };

    const baseEnvironment = makeDurable(new Environment(store, network), { durableStore });
    const draftEnvironment = makeEnvironmentDraftAware(baseEnvironment, {
        store,
        draftQueue,
        durableStore,
        ingestFunc: (_record: any, _path: any, _store: any, _timestamp: any) => {},
        generateId: (_prefix: string) => {
            return 'generatedId';
        },
        isDraftId: _id => true,
        recordResponseRetrievers: undefined,
    });
    return {
        store,
        network,
        durableStore,
        draftQueue,
        baseEnvironment,
        draftEnvironment,
    };
}

export function mockDurableStoreResponse(durableStore: DurableStore) {
    durableStore.getEntries = jest.fn().mockResolvedValue({
        [STORE_KEY_RECORD]: {
            data: {
                apiName: DEFAULT_API_NAME,
                childRelationships: {},
                eTag: '',
                fields: {
                    Name: {
                        __ref: STORE_KEY_FIELD__NAME,
                    },
                },
                id: RECORD_ID,
                lastModifiedById: null,
                lastModifiedDate: null,
                recordTypeId: null,
                recordTypeInfo: null,
                systemModstamp: null,
                weakEtag: -1,
            },
        },

        [STORE_KEY_FIELD__NAME]: {
            data: {
                displayValue: DEFAULT_NAME_FIELD_VALUE,
                value: DEFAULT_NAME_FIELD_VALUE,
            },
        },
    });
}
