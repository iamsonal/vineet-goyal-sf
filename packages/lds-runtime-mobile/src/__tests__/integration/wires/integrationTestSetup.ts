import { Luvio } from '@luvio/engine';
import {
    createRecordAdapterFactory,
    deleteRecordAdapterFactory,
    getRecordAdapterFactory,
    updateRecordAdapterFactory,
    getRecordsAdapterFactory,
    ObjectInfoRepresentation,
    keyBuilderObjectInfo,
    getRelatedListRecordsAdapterFactory,
} from '@salesforce/lds-adapters-uiapi';
import { graphQLAdapterFactory } from '@salesforce/lds-adapters-graphql';
import { DraftManager, DraftQueue, DurableDraftStore } from '@salesforce/lds-drafts';
import { MockNimbusDurableStore, mockNimbusStoreGlobal } from '../../MockNimbusDurableStore';
import { MockNimbusNetworkAdapter, mockNimbusNetworkGlobal } from '../../MockNimbusNetworkAdapter';
import {
    DefaultDurableSegment,
    DurableStoreEntry,
    DurableStoreOperationType,
} from '@luvio/environments';
import { ObjectInfoIndex, OBJECT_INFO_PREFIX_SEGMENT } from '../../../utils/ObjectInfoService';
import { flushPromises } from '../../testUtils';
import mockOpportunityObjectInfo from './data/object-Opportunity.json';
import mockAccountObjectInfo from './data/object-Account.json';
import mockUser from './data/record-User-fields-User.Id,User.City.json';
import { JSONStringify } from '../../../utils/language';

let luvio: Luvio;
let draftQueue: DraftQueue;
let draftManager: DraftManager;
let networkAdapter: MockNimbusNetworkAdapter;
let createRecord;
let getRecord;
let updateRecord;
let deleteRecord;
let getRecords;
let getRelatedListRecords;
let graphQL;

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
    await resetLuvioStore();

    const luvioDurableStore = (draftQueue as any).draftStore.durableStore;

    // reset draft store
    (draftQueue as any).draftStore = new DurableDraftStore(luvioDurableStore);

    createRecord = createRecordAdapterFactory(luvio);
    getRecord = getRecordAdapterFactory(luvio);
    deleteRecord = deleteRecordAdapterFactory(luvio);
    updateRecord = updateRecordAdapterFactory(luvio);
    getRecords = getRecordsAdapterFactory(luvio);
    getRelatedListRecords = getRelatedListRecordsAdapterFactory(luvio);
    graphQL = graphQLAdapterFactory(luvio);

    await populateDurableStoreWithObjectInfos();
    await flushPromises();

    return {
        luvio,
        durableStore,
        luvioDurableStore,
        draftQueue,
        draftManager,
        networkAdapter,
        createRecord,
        getRecord,
        deleteRecord,
        updateRecord,
        getRecords,
        getRelatedListRecords,
        graphQL,
    };
}

export async function resetLuvioStore() {
    (luvio as any).environment.storeReset();
    await flushPromises();
}

export function populateDurableStoreWithObjectInfos() {
    const accountObjectInfoIndex: DurableStoreEntry<ObjectInfoIndex> = {
        data: { apiName: 'Account', keyPrefix: '001' },
    };

    const contactObjectInfoPrefixIndex: DurableStoreEntry<ObjectInfoIndex> = {
        data: { apiName: 'Contact', keyPrefix: '005' },
    };

    const userObjectInfoIndex: DurableStoreEntry<ObjectInfoIndex> = {
        data: { apiName: 'User', keyPrefix: '005' },
    };

    const opportunityObjectInfoIndex: DurableStoreEntry<ObjectInfoIndex> = {
        data: { apiName: 'Opportunity', keyPrefix: '006' },
    };

    const opportunityObjectInfoKey = keyBuilderObjectInfo({
        apiName: mockOpportunityObjectInfo.apiName,
    });
    const opportunityObjectInfo: DurableStoreEntry<ObjectInfoRepresentation> = {
        data: { ...mockOpportunityObjectInfo },
    };

    const accountObjectInfoKey = keyBuilderObjectInfo({ apiName: mockAccountObjectInfo.apiName });
    const accountObjectInfo: DurableStoreEntry<ObjectInfoRepresentation> = {
        data: { ...mockAccountObjectInfo },
    };

    return durableStore.batchOperations(
        [
            {
                type: DurableStoreOperationType.SetEntries,
                ids: ['Account', 'Opportunity', 'User', 'Contact'],
                segment: OBJECT_INFO_PREFIX_SEGMENT,
                entries: {
                    ['Account']: JSON.stringify(accountObjectInfoIndex),
                    ['Opportunity']: JSON.stringify(opportunityObjectInfoIndex),
                    ['User']: JSON.stringify(userObjectInfoIndex),
                    ['Contact']: JSON.stringify(contactObjectInfoPrefixIndex),
                },
            },
            {
                type: DurableStoreOperationType.SetEntries,
                segment: DefaultDurableSegment,
                ids: [opportunityObjectInfoKey, accountObjectInfoKey],
                entries: {
                    [opportunityObjectInfoKey]: JSON.stringify(opportunityObjectInfo),
                    [accountObjectInfoKey]: JSON.stringify(accountObjectInfo),
                },
            },
        ],
        ''
    );
}

export async function populateL2WithUser() {
    // populate L2 with a user
    networkAdapter.setMockResponse({
        status: 200,
        headers: {},
        body: JSONStringify(mockUser),
    });

    const userSnap = await getRecord({
        recordId: mockUser.id,
        fields: ['User.City', 'User.Id'],
    });
    expect(userSnap.state).toBe('Fulfilled');

    // reset L1 so user is just in L2
    (luvio as any).environment.storeReset();

    return { ...mockUser };
}
