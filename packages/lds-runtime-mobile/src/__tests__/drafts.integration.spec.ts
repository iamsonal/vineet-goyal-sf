import timekeeper from 'timekeeper';
import { Luvio, Snapshot } from '@luvio/engine';
import { DefaultDurableSegment } from '@luvio/environments';
import {
    createRecordAdapterFactory,
    getRecordAdapterFactory,
    RecordRepresentation,
    updateRecordAdapterFactory,
    deleteRecordAdapterFactory,
} from '@salesforce/lds-adapters-uiapi';
import {
    DraftQueue,
    DraftRecordRepresentation,
    DraftDurableSegment,
    DurableDraftQueue,
    DraftManager,
    DraftActionOperationType,
} from '@salesforce/lds-drafts';
import { RECORD_TTL } from '@salesforce/lds-adapters-uiapi/karma/dist/uiapi-constants';
import { recordIdGenerator } from '@mobileplatform/record-id-generator';
import Id from '@salesforce/user/Id';

import { NimbusDurableStore } from '../NimbusDurableStore';
import { NimbusNetworkAdapter } from '../NimbusNetworkAdapter';
import { JSONStringify } from '../utils/language';
import { MockNimbusDurableStore, mockNimbusStoreGlobal } from './MockNimbusDurableStore';
import { MockNimbusAdapter, mockNimbusNetworkGlobal } from './MockNimbusNetworkAdapter';
import { flushPromises } from './testUtils';

const { isGenerated } = recordIdGenerator(Id);
const RECORD_ID = '005xx000001XL1tAAG';
const STORE_KEY_RECORD = `UiApi::RecordRepresentation:${RECORD_ID}`;
const API_NAME = 'Account';

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

describe('lds drafts integration tests', () => {
    let luvio: Luvio;
    let draftQueue: DraftQueue;
    let draftManager: DraftManager;
    let networkAdapter: MockNimbusAdapter;
    let durableStore: MockNimbusDurableStore;
    let createRecord;
    let updateRecord;
    let deleteRecord;
    let getRecord;

    beforeEach(async () => {
        durableStore = new MockNimbusDurableStore();
        mockNimbusStoreGlobal(durableStore);

        networkAdapter = new MockNimbusAdapter();
        mockNimbusNetworkGlobal(networkAdapter);

        const runtime = await import('../main');
        luvio = runtime.luvio;
        draftQueue = runtime.draftQueue;
        draftManager = runtime.draftManager;
        (luvio as any).environment.store.reset();

        createRecord = createRecordAdapterFactory(luvio);
        updateRecord = updateRecordAdapterFactory(luvio);
        deleteRecord = deleteRecordAdapterFactory(luvio);
        getRecord = getRecordAdapterFactory(luvio);
    });

    describe('createRecord', () => {
        it('createRecord returns synthetic record', async () => {
            const networkSpy = jest.fn();
            networkAdapter.sendRequest = networkSpy;
            const snapshot = await createRecord({ apiName: API_NAME, fields: { Name: 'Justin' } });
            expect(snapshot.state).toBe('Fulfilled');
            const record = (snapshot.data as unknown) as DraftRecordRepresentation;
            expect(networkSpy).toHaveBeenCalledTimes(0);
            expect(record.drafts.created).toBe(true);
        });

        it('synthetic record responds with null fields it does not know about', async () => {
            const snapshot = await createRecord({ apiName: API_NAME, fields: { Name: 'Justin' } });
            expect(snapshot.state).toBe('Fulfilled');
            const record = (snapshot.data as unknown) as DraftRecordRepresentation;

            const getRecordSnapshot = (await getRecord({
                recordId: record.id,
                fields: ['Account.Name', 'Account.BillingCity'],
            })) as Snapshot<RecordRepresentation>;
            expect(getRecordSnapshot.state).toBe('Fulfilled');
        });

        it('record with generated ID does not get stored in default durable segment', async () => {
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
            expect(Object.keys(entriesInDefaultSegment.entries).length).toBe(0);

            const entriesInDraftSegment = await durableStore.getAllEntriesInSegment(
                DraftDurableSegment
            );
            expect(Object.keys(entriesInDraftSegment.entries).length).toBe(1);

            const value = Object.values(entriesInDraftSegment.entries)[0];
            const parsedValue = JSON.parse(value);
            const tag = parsedValue['data']['tag'];
            const formattedTagWithRecordId = `UiApi::RecordRepresentation:${recordId}`;
            expect(tag).toBe(formattedTagWithRecordId);
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

    describe('updateRecord', () => {
        it('getRecord updates when draft change to synthetic record is made', async () => {
            const orginalName = 'Justin';
            const updatedName = 'Jason';
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
                fields: ['Account.Name'],
            })) as Snapshot<RecordRepresentation>;
            expect(getRecordSnapshot.state).toBe('Fulfilled');
            const callbackSpy = jest.fn();
            // subscribe to getRecord snapshot
            luvio.storeSubscribe(getRecordSnapshot, callbackSpy);

            // update the synthetic record
            await updateRecord({ recordId, fields: { Name: updatedName } });

            // ensure the getRecord callback was invoked
            expect(callbackSpy).toBeCalledTimes(1);
            // ensure the getRecord callback was invoked with updated draft data value
            expect(callbackSpy.mock.calls[0][0].data.fields.Name.value).toBe(updatedName);
            expect(callbackSpy.mock.calls[0][0].data.drafts.serverValues.Name.value).toBe(
                orginalName
            );
        });

        it('getRecord includes draft overlay on stale response', async () => {
            const originalNameValue = 'Justin';
            const draftOneNameValue = 'Jason';
            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(
                    createTestRecord(RECORD_ID, originalNameValue, originalNameValue, 1)
                ),
            });

            const snapshot = await getRecord({ recordId: RECORD_ID, fields: ['Account.Name'] });
            expect(snapshot.state).toBe('Fulfilled');

            // create a draft edit
            await updateRecord({
                recordId: RECORD_ID,
                fields: { Name: draftOneNameValue },
            });

            // let record TTL expire
            timekeeper.travel(Date.now() + RECORD_TTL + 1);

            const staleSnapshot = await getRecord({
                recordId: RECORD_ID,
                fields: ['Account.Name'],
            });
            expect(staleSnapshot.state).toBe('Stale');
            expect(staleSnapshot.data.drafts.edited).toBe(true);
            expect(staleSnapshot.data.fields['Name']).toStrictEqual({
                value: draftOneNameValue,
                displayValue: draftOneNameValue,
            });
        });

        it('serverValues get updated on network response', async () => {
            const originalNameValue = 'Justin';
            const draftOneNameValue = 'Jason';
            const draftTwoNameValue = 'Wes';

            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(
                    createTestRecord(RECORD_ID, originalNameValue, originalNameValue, 1)
                ),
            });

            const snapshot = await getRecord({ recordId: RECORD_ID, fields: ['Account.Name'] });
            expect(snapshot.state).toBe('Fulfilled');

            const getRecordCallbackSpy = jest.fn();
            luvio.storeSubscribe(snapshot, getRecordCallbackSpy);

            await updateRecord({
                recordId: RECORD_ID,
                fields: { Name: draftOneNameValue },
            });

            await updateRecord({
                recordId: RECORD_ID,
                fields: { Name: draftTwoNameValue },
            });
            expect(getRecordCallbackSpy).toBeCalledTimes(2);

            expect(getRecordCallbackSpy.mock.calls[0][0].data.fields.Name.value).toBe(
                draftOneNameValue
            );
            expect(getRecordCallbackSpy.mock.calls[0][0].data.drafts.edited).toBe(true);

            expect(getRecordCallbackSpy.mock.calls[1][0].data.fields.Name.value).toBe(
                draftTwoNameValue
            );
            expect(getRecordCallbackSpy.mock.calls[1][0].data.drafts.edited).toBe(true);
            expect(getRecordCallbackSpy.mock.calls[1][0].data.drafts.serverValues.Name.value).toBe(
                originalNameValue
            );

            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(
                    createTestRecord(RECORD_ID, draftOneNameValue, draftOneNameValue, 2)
                ),
            });

            await draftQueue.processNextAction();

            // the draft queue completed listener asynchronously ingests so have to flush promises
            await flushPromises();

            expect(getRecordCallbackSpy).toBeCalledTimes(3);

            // should still contain the second draft data
            expect(getRecordCallbackSpy.mock.calls[2][0].data.fields.Name.value).toBe(
                draftTwoNameValue
            );
            expect(getRecordCallbackSpy.mock.calls[2][0].data.drafts.edited).toBe(true);
            // the server value should be updated
            expect(getRecordCallbackSpy.mock.calls[2][0].data.drafts.serverValues.Name.value).toBe(
                draftOneNameValue
            );
        });

        it('drafts property removed after upload succeeded', async () => {
            const originalNameValue = 'Justin';
            const updatedNameValue = 'Jason';

            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(
                    createTestRecord(RECORD_ID, originalNameValue, originalNameValue, 1)
                ),
            });

            const snapshot = await getRecord({ recordId: RECORD_ID, fields: ['Account.Name'] });
            expect(snapshot.state).toBe('Fulfilled');

            const getRecordCallbackSpy = jest.fn();
            luvio.storeSubscribe(snapshot, getRecordCallbackSpy);

            await updateRecord({
                recordId: RECORD_ID,
                fields: { Name: updatedNameValue },
            });

            // before upload we should get back the optimistic response with drafts property
            expect(getRecordCallbackSpy).toBeCalledTimes(1);
            expect(getRecordCallbackSpy.mock.calls[0][0].data.fields.Name.value).toBe(
                updatedNameValue
            );
            expect(getRecordCallbackSpy.mock.calls[0][0].data.drafts.edited).toBe(true);
            expect(getRecordCallbackSpy.mock.calls[0][0].data.drafts.serverValues.Name.value).toBe(
                originalNameValue
            );

            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(
                    createTestRecord(RECORD_ID, updatedNameValue, updatedNameValue, 2)
                ),
            });

            await draftQueue.processNextAction();

            // the draft queue completed listener asynchronously ingests so have to flush promises
            await flushPromises();

            expect(getRecordCallbackSpy).toBeCalledTimes(2);

            // second callback should not be a draft anymore
            expect(getRecordCallbackSpy.mock.calls[1][0].data.fields.Name.value).toBe(
                updatedNameValue
            );
            expect(getRecordCallbackSpy.mock.calls[1][0].data.drafts).toBeUndefined();
        });

        it('creates update item in queue visible by draft manager', async () => {
            const originalNameValue = 'Justin';
            const draftOneNameValue = 'Jason';
            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(
                    createTestRecord(RECORD_ID, originalNameValue, originalNameValue, 1)
                ),
            });

            await getRecord({ recordId: RECORD_ID, fields: ['Account.Name'] });
            // create a draft edit
            await updateRecord({
                recordId: RECORD_ID,
                fields: { Name: draftOneNameValue },
            });

            const subject = await draftManager.getQueue();
            expect(subject.items.length).toBe(1);
            expect(subject.items[0]).toMatchObject({
                operationType: DraftActionOperationType.Update,
            });
        });
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
    });

    describe('registerOnChangedListener', () => {
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
            durableStore.raiseOnChangedEvent = true;
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
            durableStore.raiseOnChangedEvent = false;

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
