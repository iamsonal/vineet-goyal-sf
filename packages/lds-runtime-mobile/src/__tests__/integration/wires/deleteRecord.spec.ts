import { Luvio, Snapshot } from '@luvio/engine';
import {
    createRecordAdapterFactory,
    deleteRecordAdapterFactory,
    getRecordAdapterFactory,
    keyBuilderRecord,
    RecordRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import {
    DraftManager,
    DraftQueue,
    DraftActionOperationType,
    DurableDraftQueue,
} from '@salesforce/lds-drafts';
import { DraftRecordRepresentation } from '@salesforce/lds-drafts/dist/utils/records';
import { NimbusDurableStore } from '../../../NimbusDurableStore';
import { NimbusNetworkAdapter } from '../../../network/NimbusNetworkAdapter';
import { JSONStringify } from '../../../utils/language';
import { MockNimbusDurableStore, mockNimbusStoreGlobal } from '../../MockNimbusDurableStore';
import { MockNimbusAdapter, mockNimbusNetworkGlobal } from '../../MockNimbusNetworkAdapter';
import { flushPromises } from '../../testUtils';
import mockAccount from './data/record-Account-fields-Account.Id,Account.Name.json';

const RECORD_ID = mockAccount.id;
const API_NAME = 'Account';

const STORE_KEY_RECORD = keyBuilderRecord({ recordId: RECORD_ID });

function createTestRecord(
    id: string,
    nameValue: string,
    nameDisplayValue: string,
    weakEtag: number
): RecordRepresentation {
    return {
        apiName: API_NAME,
        childRelationships: {},
        eTag: '7bac4baab876b2a4e32d8e8690135f9d',
        fields: {
            Name: {
                displayValue: nameDisplayValue,
                value: nameValue,
            },
        },
        id: id,
        lastModifiedById: '00530000004tNS4AAM',
        lastModifiedDate: '2019-10-16T11:52:48.000Z',
        recordTypeId: '012000000000000AAA',
        recordTypeInfo: null,
        systemModstamp: '2019-10-21T14:52:51.000Z',
        weakEtag: weakEtag,
    };
}

describe('mobile runtime integration tests', () => {
    let luvio: Luvio;
    let draftQueue: DraftQueue;
    let draftManager: DraftManager;
    let networkAdapter: MockNimbusAdapter;
    let durableStore: MockNimbusDurableStore;
    let createRecord;
    let deleteRecord;
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
        deleteRecord = deleteRecordAdapterFactory(luvio);
        getRecord = getRecordAdapterFactory(luvio);
    });

    describe('deleteRecord', () => {
        it('deleteRecord sets draft deleted to true', async () => {
            const snapshot = await createRecord({
                apiName: API_NAME,
                fields: { Name: 'TestRecord' },
            });

            const createdRecord = (snapshot.data as unknown) as DraftRecordRepresentation;
            expect(snapshot.data.drafts.deleted).toBe(false);

            const getNewRecordSnapshot = (await getRecord({
                recordId: createdRecord.id,
                fields: ['Account.Name'],
            })) as Snapshot<RecordRepresentation>;

            const newRecord = (getNewRecordSnapshot.data as unknown) as DraftRecordRepresentation;
            expect(newRecord.drafts.deleted).toBe(false);

            // delete the record
            await deleteRecord(newRecord.id);

            const getRecordSnapshot = (await getRecord({
                recordId: newRecord.id,
                fields: ['Account.Name'],
            })) as Snapshot<RecordRepresentation>;

            const deletedRecord = (getRecordSnapshot.data as unknown) as DraftRecordRepresentation;
            expect(deletedRecord.drafts.deleted).toBe(true);
        });

        it('creates delete item in queue visible by draft manager', async () => {
            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(createTestRecord(RECORD_ID, 'Mock', 'Mock', 1)),
            });

            await getRecord({ recordId: RECORD_ID, fields: ['Account.Name'] });
            // delete the record
            await deleteRecord(RECORD_ID);

            const subject = await draftManager.getQueue();
            expect(subject.items.length).toBe(1);
            expect(subject.items[0]).toMatchObject({
                operationType: DraftActionOperationType.Delete,
            });
        });

        it('getRecord subscription notified when delete DRAFT enters durable store', async () => {
            const fieldName = 'foo';
            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(createTestRecord(RECORD_ID, fieldName, fieldName, 1)),
            });

            const snapshot = await getRecord({ recordId: RECORD_ID, fields: ['Account.Name'] });
            expect(snapshot.state).toBe('Fulfilled');

            const getRecordCallbackSpy = jest.fn();
            luvio.storeSubscribe(snapshot, getRecordCallbackSpy);

            // simulate another draft queue enqueuing a delete (which will modify
            // durable store)
            const nimbusDurableStore2 = new NimbusDurableStore();
            const queue = new DurableDraftQueue(nimbusDurableStore2, NimbusNetworkAdapter);
            await queue.enqueue(
                {
                    method: 'delete',
                    urlParams: { recordId: RECORD_ID },
                    queryParams: {},
                    basePath: '',
                    baseUri: '',
                    body: null,
                    headers: {},
                },
                STORE_KEY_RECORD
            );

            await flushPromises();

            // before upload we should get back the optimistic response with drafts property
            expect(getRecordCallbackSpy).toBeCalledTimes(1);
            expect(getRecordCallbackSpy.mock.calls[0][0].data.drafts.deleted).toBe(true);

            networkAdapter.setMockResponses([
                {
                    status: 204,
                    headers: {},
                    body: null,
                },
                {
                    status: 404,
                    headers: {},
                    body: JSON.stringify({}),
                },
            ]);

            // now have our main queue upload the action
            await draftQueue.processNextAction();

            // the draft queue completed listener asynchronously ingests so have to flush promises
            await flushPromises();

            expect(getRecordCallbackSpy).toBeCalledTimes(2);

            // second callback should emit a 404
            expect(getRecordCallbackSpy.mock.calls[1][0].data).toBeUndefined();
            expect(getRecordCallbackSpy.mock.calls[1][0].error.status).toBe(404);
        });
    });
});
