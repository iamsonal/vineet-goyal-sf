import { Luvio, Snapshot } from '@luvio/engine';
import {
    createRecordAdapterFactory,
    getRecordAdapterFactory,
    RecordRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import {
    DraftManager,
    DraftQueue,
    DRAFT_SEGMENT,
    ProcessActionResult,
    DraftActionOperationType,
} from '@salesforce/lds-drafts';
import { DraftRecordRepresentation } from '@salesforce/lds-drafts/dist/utils/records';
import { JSONStringify } from '../../../utils/language';
import { MockNimbusDurableStore, mockNimbusStoreGlobal } from '../../MockNimbusDurableStore';
import { MockNimbusAdapter, mockNimbusNetworkGlobal } from '../../MockNimbusNetworkAdapter';
import { flushPromises } from '../../testUtils';
import mockAccount from './data/record-Account-fields-Account.Id,Account.Name.json';
import { recordIdGenerator } from '../../../RecordIdGenerator';
import { DefaultDurableSegment, DurableStoreEntry } from '@luvio/environments';
import Id from '@salesforce/user/Id';
import { ObjectInfoIndex, OBJECT_INFO_PREFIX_SEGMENT } from '../../../utils/ObjectInfoService';

const RECORD_ID = mockAccount.id;
const API_NAME = 'Account';

const { isGenerated } = recordIdGenerator(Id);

describe('mobile runtime integration tests', () => {
    let luvio: Luvio;
    let draftQueue: DraftQueue;
    let draftManager: DraftManager;
    let networkAdapter: MockNimbusAdapter;
    let durableStore: MockNimbusDurableStore;
    let createRecord;
    let getRecord;

    beforeEach(async () => {
        durableStore = new MockNimbusDurableStore();
        mockNimbusStoreGlobal(durableStore);

        networkAdapter = new MockNimbusAdapter();
        mockNimbusNetworkGlobal(networkAdapter);

        const runtime = await import('../../../main');
        luvio = runtime.luvio;
        draftQueue = runtime.draftQueue;
        draftQueue.stopQueue();
        draftManager = runtime.draftManager;
        (luvio as any).environment.store.reset();

        createRecord = createRecordAdapterFactory(luvio);
        getRecord = getRecordAdapterFactory(luvio);

        const accountObjectInfo: DurableStoreEntry<ObjectInfoIndex> = {
            data: { apiName: API_NAME, keyPrefix: '001' },
        };
        durableStore.setEntriesInSegment(
            {
                [API_NAME]: JSON.stringify(accountObjectInfo),
            },
            OBJECT_INFO_PREFIX_SEGMENT
        );
    });

    describe('createRecord', () => {
        it('createRecord returns synthetic record', async () => {
            const networkSpy = jest.fn();
            const snapshot = await createRecord({ apiName: API_NAME, fields: { Name: 'Justin' } });
            expect(snapshot.state).toBe('Fulfilled');
            const record = (snapshot.data as unknown) as DraftRecordRepresentation;
            expect(networkSpy).toHaveBeenCalledTimes(0);
            expect(record.drafts.created).toBe(true);
        });

        it('record with generated ID does not get stored in default durable segment', async () => {
            const startingEntries = await durableStore.getAllEntriesInSegment(
                DefaultDurableSegment
            );
            const entryCount = Object.keys(startingEntries.entries).length;

            const orginalName = 'Justin';

            // create a synthetic record
            const snapshot = await createRecord({
                apiName: API_NAME,
                fields: { Name: orginalName },
            });
            const record = snapshot.data;
            const recordId = record.id;
            const isGeneratedRecordId = isGenerated(recordId);
            expect(isGeneratedRecordId).toBe(true);

            const entriesInDefaultSegment = await durableStore.getAllEntriesInSegment(
                DefaultDurableSegment
            );
            expect(Object.keys(entriesInDefaultSegment.entries).length).toBe(entryCount);

            const entriesInDraftSegment = await durableStore.getAllEntriesInSegment(DRAFT_SEGMENT);
            expect(Object.keys(entriesInDraftSegment.entries).length).toBe(1);

            const value = Object.values(entriesInDraftSegment.entries)[0];
            const parsedValue = JSON.parse(value);
            const tag = parsedValue['data']['tag'];
            const formattedTagWithRecordId = `UiApi::RecordRepresentation:${recordId}`;
            expect(tag).toBe(formattedTagWithRecordId);
        });

        it('created record is still obervable after draft is uploaded', async () => {
            const orginalName = 'Justin';
            // create a synthetic record
            const snapshot = await createRecord({
                apiName: API_NAME,
                fields: { Name: orginalName },
            });
            const record = snapshot.data;
            const recordId = record.id;
            // call getRecord with synthetic record id
            const getRecordSnapshot = (await getRecord({
                recordId: recordId,
                fields: ['Account.Name', 'Account.Id'],
            })) as Snapshot<RecordRepresentation>;
            expect(getRecordSnapshot.state).toBe('Fulfilled');
            const callbackSpy = jest.fn();
            // subscribe to getRecord snapshot
            luvio.storeSubscribe(getRecordSnapshot, callbackSpy);

            networkAdapter.setMockResponse({
                status: 201,
                headers: {},
                body: JSONStringify(mockAccount),
            });

            // upload the draft and respond with a record with more fields and a new id
            const result = await draftQueue.processNextAction();
            await flushPromises();
            expect(result).toBe(ProcessActionResult.ACTION_SUCCEEDED);

            // make sure getRecord callback was called
            expect(callbackSpy).toBeCalledTimes(1);
            // ensure the callback id value has the updated canonical server id
            expect(callbackSpy.mock.calls[0][0].data.fields.Id.value).toBe(RECORD_ID);
        });
        it('creates a create item in queue visible by draft manager', async () => {
            await createRecord({ apiName: API_NAME, fields: { Name: 'Justin' } });
            const subject = await draftManager.getQueue();
            expect(subject.items.length).toBe(1);
            expect(subject.items[0]).toMatchObject({
                operationType: DraftActionOperationType.Create,
            });
        });
    });
});
