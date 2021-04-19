import { MockDurableStore } from '@luvio/adapter-test-library';
import { Environment, Luvio, Store } from '@luvio/engine';
import { makeDurable, makeOffline } from '@luvio/environments';
import { getRecordAdapterFactory } from '@salesforce/lds-adapters-uiapi';
import { DraftQueue } from '../../DraftQueue';
import { DRAFT_RECORD_ID } from '../../__tests__/test-utils';
import { makeEnvironmentDraftAware } from '../makeEnvironmentDraftAware';

export * from '../../__tests__/test-utils';

export function setupDraftEnvironment(
    setupOptions: {
        mockNetworkResponse?: any;
        isDraftId?: (id: string) => boolean;
        prefixForApiName?: (apiName: string) => Promise<string>;
        apiNameForPrefix?: (prefix: string) => Promise<string>;
    } = {}
) {
    const { mockNetworkResponse } = setupOptions;
    const store = new Store();
    const network = jest.fn().mockResolvedValue(mockNetworkResponse ?? {});
    const durableStore = new MockDurableStore();
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
        replaceAction: jest.fn(),
        setMetadata: jest.fn(),
    };
    const baseEnvironment = makeDurable(makeOffline(new Environment(store, network)), {
        durableStore,
    });

    const realGetRecord = getRecordAdapterFactory(new Luvio(baseEnvironment));
    const adapters = {
        getRecord: jest.fn().mockImplementation(realGetRecord),
    };
    const draftEnvironment = makeEnvironmentDraftAware(
        baseEnvironment,
        {
            store,
            draftQueue,
            durableStore,
            ingestFunc: (_record: any, _path: any, _store: any, _timestamp: any) => {},
            generateId: (prefix: string) => {
                return `${prefix}${DRAFT_RECORD_ID.substring(4, DRAFT_RECORD_ID.length)}`;
            },
            isDraftId: setupOptions.isDraftId ?? (id => id === DRAFT_RECORD_ID),
            getRecord: adapters.getRecord,
            prefixForApiName: setupOptions.prefixForApiName ?? jest.fn(),
            apiNameForPrefix: setupOptions.apiNameForPrefix ?? jest.fn(),
            recordResponseRetrievers: undefined,
        },
        'testUserId'
    );
    return {
        store,
        network,
        durableStore,
        draftQueue,
        baseEnvironment,
        draftEnvironment,
        adapters,
    };
}
