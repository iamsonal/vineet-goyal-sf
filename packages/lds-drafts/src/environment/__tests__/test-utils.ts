import { Environment, Store } from '@luvio/engine';
import { DurableStore, makeDurable } from '@luvio/environments';
import { DraftQueue } from '../../DraftQueue';
import { DRAFT_RECORD_ID } from '../../__tests__/test-utils';
import { makeEnvironmentDraftAware } from '../makeEnvironmentDraftAware';

export * from '../../__tests__/test-utils';

export function setupDraftEnvironment(
    setupOptions: {
        mockNetworkResponse?: any;
        isDraftId?: (id: string) => boolean;
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
            return DRAFT_RECORD_ID;
        },
        isDraftId: setupOptions.isDraftId ?? (id => id === DRAFT_RECORD_ID),
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
