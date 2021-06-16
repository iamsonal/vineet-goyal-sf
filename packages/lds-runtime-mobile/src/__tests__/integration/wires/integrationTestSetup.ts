import { Luvio } from '@luvio/engine';
import {
    createRecordAdapterFactory,
    deleteRecordAdapterFactory,
    getRecordAdapterFactory,
    updateRecordAdapterFactory,
    getRecordsAdapterFactory,
} from '@salesforce/lds-adapters-uiapi';
import { DraftManager, DraftQueue } from '@salesforce/lds-drafts';
import { MockNimbusDurableStore, mockNimbusStoreGlobal } from '../../MockNimbusDurableStore';
import { MockNimbusNetworkAdapter, mockNimbusNetworkGlobal } from '../../MockNimbusNetworkAdapter';
import { DurableStoreEntry, DurableStoreOperationType } from '@luvio/environments';
import { ObjectInfoIndex, OBJECT_INFO_PREFIX_SEGMENT } from '../../../utils/ObjectInfoService';
import { flushPromises } from '../../testUtils';

let luvio: Luvio;
let draftQueue: DraftQueue;
let draftManager: DraftManager;
let networkAdapter: MockNimbusNetworkAdapter;
let createRecord;
let getRecord;
let updateRecord;
let deleteRecord;
let getRecords;

// we want the same instance of MockNimbusDurableStore since we don't
// want to lose the listeners between tests (luvio instance only registers
// the listeners once on static import)
const durableStore = new MockNimbusDurableStore();
mockNimbusStoreGlobal(durableStore);

export async function setup() {
    await flushPromises();

    await durableStore.resetStore();

    networkAdapter = new MockNimbusNetworkAdapter();
    mockNimbusNetworkGlobal(networkAdapter);

    const runtime = await import('../../../main');
    luvio = runtime.luvio;
    draftQueue = runtime.draftQueue;
    draftQueue.stopQueue();
    draftManager = runtime.draftManager;
    (luvio as any).environment.store.reset();

    createRecord = createRecordAdapterFactory(luvio);
    getRecord = getRecordAdapterFactory(luvio);
    deleteRecord = deleteRecordAdapterFactory(luvio);
    updateRecord = updateRecordAdapterFactory(luvio);
    getRecords = getRecordsAdapterFactory(luvio);

    await populateDurableStoreWithObjectInfos();
    await flushPromises();

    return {
        luvio,
        durableStore,
        draftQueue,
        draftManager,
        networkAdapter,
        createRecord,
        getRecord,
        deleteRecord,
        updateRecord,
        getRecords,
    };
}

export function populateDurableStoreWithObjectInfos() {
    const accountObjectInfo: DurableStoreEntry<ObjectInfoIndex> = {
        data: { apiName: 'Account', keyPrefix: '001' },
    };

    const userObjectInfo: DurableStoreEntry<ObjectInfoIndex> = {
        data: { apiName: 'User', keyPrefix: '005' },
    };

    const opportunityObjectInfo: DurableStoreEntry<ObjectInfoIndex> = {
        data: { apiName: 'Opportunity', keyPrefix: '006' },
    };

    return durableStore.batchOperations(
        [
            {
                type: DurableStoreOperationType.SetEntries,
                ids: ['Account', 'Opportunity', 'User'],
                segment: OBJECT_INFO_PREFIX_SEGMENT,
                entries: {
                    ['Account']: JSON.stringify(accountObjectInfo),
                    ['Opportunity']: JSON.stringify(opportunityObjectInfo),
                    ['User']: JSON.stringify(userObjectInfo),
                },
            },
        ],
        ''
    );
}
