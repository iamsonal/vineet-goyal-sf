import { Environment, Luvio, Store } from '@luvio/engine';
import { DurableStore, makeDurable } from '@luvio/environments';
import { getRecordAdapterFactory } from '@salesforce/lds-adapters-uiapi';
import { DraftQueue } from '../../DraftQueue';
import { DRAFT_RECORD_ID } from '../../__tests__/test-utils';
import { makeEnvironmentDraftAware } from '../makeEnvironmentDraftAware';

export * from '../../__tests__/test-utils';

export function setupDraftEnvironment(
    setupOptions: {
        mockNetworkResponse?: any;
        isDraftId?: (id: string) => boolean;
        getRecordMock?: any;
        prefixForApiName?: (apiName: string) => Promise<string>;
        apiNameForPrefix?: (prefix: string) => Promise<string>;
    } = {}
) {
    const { mockNetworkResponse, getRecordMock } = setupOptions;
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
        replaceAction: jest.fn(),
        setMetadata: jest.fn(),
    };
    const baseEnvironment = makeDurable(new Environment(store, network), { durableStore });
    const adapters = {
        getRecord: getRecordMock ?? getRecordAdapterFactory(new Luvio(baseEnvironment)),
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
            ...adapters,
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
