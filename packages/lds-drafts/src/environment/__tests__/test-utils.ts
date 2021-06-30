import { MockDurableStore } from '@luvio/adapter-test-library';
import { Environment, Luvio, Store } from '@luvio/engine';
import { DefaultDurableSegment, DurableStore, makeDurable, makeOffline } from '@luvio/environments';
import { getRecordAdapterFactory, keyBuilderObjectInfo } from '@salesforce/lds-adapters-uiapi';
import { DraftQueue } from '../../DraftQueue';
import { makeDurableStoreDraftAware } from '../../durableStore/makeDurableStoreDraftAware';
import {
    makeRecordDenormalizingDurableStore,
    RecordDenormalizingDurableStore,
} from '../../durableStore/makeRecordDenormalizingDurableStore';
import { DRAFT_RECORD_ID } from '../../__tests__/test-utils';
import { makeEnvironmentDraftAware } from '../makeEnvironmentDraftAware';
import AccountObjectInfo from './mockData/object-Account.json';
const AccountObjectInfoKey = keyBuilderObjectInfo({ apiName: AccountObjectInfo.apiName });

export * from '../../__tests__/test-utils';

export async function setupDraftEnvironment(
    setupOptions: {
        mockNetworkResponse?: any;
        isDraftId?: (id: string) => boolean;
        prefixForApiName?: (apiName: string) => Promise<string>;
        apiNameForPrefix?: (prefix: string) => Promise<string>;
        skipPopulatingAccountObjectInfo?: boolean;
    } = {}
) {
    const { mockNetworkResponse } = setupOptions;
    const store = new Store();
    const network = jest.fn().mockResolvedValue(mockNetworkResponse || {});
    let durableStore: DurableStore = new MockDurableStore();

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

    durableStore = makeDurableStoreDraftAware(
        durableStore,
        () => Promise.resolve({}),
        'testUserId'
    );
    durableStore = makeRecordDenormalizingDurableStore(durableStore, store);

    const baseEnvironment = makeDurable(makeOffline(new Environment(store, network)), {
        durableStore,
    });

    const realGetRecord = getRecordAdapterFactory(new Luvio(baseEnvironment));
    const adapters = {
        getRecord: jest.fn().mockImplementation(realGetRecord),
    };
    const registerDraftKeyMapping = jest.fn();
    const draftEnvironment = makeEnvironmentDraftAware(baseEnvironment, {
        store,
        draftQueue,
        durableStore: durableStore as RecordDenormalizingDurableStore,
        ingestFunc: (_record: any) => {},
        generateId: (prefix: string) => {
            return `${prefix}${DRAFT_RECORD_ID.substring(4, DRAFT_RECORD_ID.length)}`;
        },
        isDraftId: setupOptions.isDraftId || ((id) => id === DRAFT_RECORD_ID),
        getRecord: adapters.getRecord,
        prefixForApiName: setupOptions.prefixForApiName || jest.fn(),
        apiNameForPrefix: setupOptions.apiNameForPrefix || jest.fn(),
        userId: 'testUserId',
        registerDraftKeyMapping: registerDraftKeyMapping,
    });

    if (setupOptions.skipPopulatingAccountObjectInfo !== true) {
        await populateDurableStoreWithAccountObjectInfo(durableStore);
    }

    return {
        store,
        network,
        durableStore: durableStore as RecordDenormalizingDurableStore,
        draftQueue,
        baseEnvironment,
        draftEnvironment,
        adapters,
        registerDraftKeyMapping,
    };
}

async function populateDurableStoreWithAccountObjectInfo(durableStore: DurableStore) {
    await durableStore.setEntries(
        {
            [AccountObjectInfoKey]: { data: AccountObjectInfo },
        },
        DefaultDurableSegment
    );
}

export function populateDurableStoreWithRecord(
    durableStore: DurableStore,
    key: string,
    record: any
) {
    return durableStore.setEntries({ [key]: { data: record } }, DefaultDurableSegment);
}
