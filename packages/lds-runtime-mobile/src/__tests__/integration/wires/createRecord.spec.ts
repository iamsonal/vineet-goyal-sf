import { Luvio, Snapshot } from '@luvio/engine';
import {
    createRecordAdapterFactory,
    getRecordAdapterFactory,
    RecordRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import {
    DraftManager,
    DraftQueue,
    ProcessActionResult,
    DraftActionOperationType,
} from '@salesforce/lds-drafts';
import { DraftRecordRepresentation } from '@salesforce/lds-drafts/dist/utils/records';
import { JSONStringify } from '../../../utils/language';
import { MockNimbusDurableStore, mockNimbusStoreGlobal } from '../../MockNimbusDurableStore';
import { MockNimbusAdapter, mockNimbusNetworkGlobal } from '../../MockNimbusNetworkAdapter';
import { flushPromises } from '../../testUtils';
import mockAccount from './data/record-Account-fields-Account.Id,Account.Name.json';
import { DurableStoreEntry } from '@luvio/environments';
import { ObjectInfoIndex, OBJECT_INFO_PREFIX_SEGMENT } from '../../../utils/ObjectInfoService';

const RECORD_ID = mockAccount.id;
const API_NAME = 'Account';

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

        it('created record gets persisted', async () => {
            const snapshot = await createRecord({ apiName: API_NAME, fields: { Name: 'Justin' } });
            (luvio as any).environment.storeReset();

            const record = snapshot.data;
            const recordId = record.id;
            // call getRecord with synthetic record id
            const getRecordSnapshot = (await getRecord({
                recordId: recordId,
                fields: ['Account.Name', 'Account.Id'],
            })) as Snapshot<RecordRepresentation>;
            expect(getRecordSnapshot.state).toBe('Fulfilled');
        });
        it('created record is still observable after draft is uploaded', async () => {
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
