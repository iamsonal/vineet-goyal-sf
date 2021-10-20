import { MockDurableStore } from '@luvio/adapter-test-library';
import { Adapter, Environment, FulfilledSnapshot, Luvio, Store } from '@luvio/engine';
import { DefaultDurableSegment, DurableStore, makeDurable, makeOffline } from '@luvio/environments';
import {
    getRecordAdapterFactory,
    keyBuilderObjectInfo,
    GetObjectInfoConfig,
    ObjectInfoRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { DraftQueue } from '../../DraftQueue';
import { makeDurableStoreDraftAware } from '../../durableStore/makeDurableStoreDraftAware';
import {
    makeRecordDenormalizingDurableStore,
    RecordDenormalizingDurableStore,
} from '../../durableStore/makeRecordDenormalizingDurableStore';
import { DraftQueueChangeListener } from '../../main';
import { DRAFT_RECORD_ID } from '../../__tests__/test-utils';
import { makeEnvironmentDraftAware } from '../makeEnvironmentDraftAware';

import AccountObjectInfo from './mockData/object-Account.json';
const AccountObjectInfoKey = keyBuilderObjectInfo({ apiName: AccountObjectInfo.apiName });

export * from '../../__tests__/test-utils';

export class MockDraftQueue implements DraftQueue {
    listeners = new Set<DraftQueueChangeListener>();
    enqueue = jest.fn().mockResolvedValue(undefined);
    getActionsForTags = jest.fn();
    processNextAction = jest.fn();
    registerOnChangedListener(listener: DraftQueueChangeListener): () => Promise<void> {
        this.listeners.add(listener);
        return () => {
            return Promise.resolve();
        };
    }
    getQueueActions = jest.fn();
    getQueueState = jest.fn();
    startQueue = jest.fn();
    stopQueue = jest.fn();
    removeDraftAction = jest.fn();
    replaceAction = jest.fn();
    setMetadata = jest.fn();
    addCustomHandler = jest.fn();
    addHandler = jest.fn();
    removeHandler = jest.fn();
}

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

    let draftQueue = new MockDraftQueue();

    durableStore = makeDurableStoreDraftAware(
        durableStore,
        () => Promise.resolve({}),
        'testUserId'
    );
    durableStore = makeRecordDenormalizingDurableStore(
        durableStore,
        () => store.records,
        () => store.metadata
    );

    const baseEnvironment = makeDurable(makeOffline(new Environment(store, network)), {
        durableStore,
    });

    const realGetRecord = getRecordAdapterFactory(new Luvio(baseEnvironment));
    const adapters = {
        getRecord: jest.fn().mockImplementation(realGetRecord),
    };
    const registerDraftIdMapping = jest.fn();
    const defaultApiNameForPrefix = (prefix: string) => {
        return Promise.resolve(prefix === '001' ? 'Account' : undefined);
    };
    const defaultPrefixForApiName = (apiName: string) => {
        return Promise.resolve(apiName === 'Account' ? '001' : undefined);
    };

    let getObjectInfo: Adapter<GetObjectInfoConfig, ObjectInfoRepresentation>;
    const accountEntry = { data: AccountObjectInfo };
    const snapshot: Partial<FulfilledSnapshot<ObjectInfoRepresentation, {}>> = {
        data: accountEntry.data as ObjectInfoRepresentation,
    };
    getObjectInfo = jest.fn().mockResolvedValue(snapshot);

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
        prefixForApiName: setupOptions.prefixForApiName || defaultPrefixForApiName,
        apiNameForPrefix: setupOptions.apiNameForPrefix || defaultApiNameForPrefix,
        userId: 'testUserId',
        registerDraftIdMapping,
        getObjectInfo: getObjectInfo,
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
        registerDraftIdMapping,
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
