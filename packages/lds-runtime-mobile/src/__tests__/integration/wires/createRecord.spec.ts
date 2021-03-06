import { Luvio, Snapshot } from '@luvio/engine';
import {
    RecordRepresentation,
    keyBuilderRecord,
    ObjectInfoRepresentation,
    keyBuilderObjectInfo,
} from '@salesforce/lds-adapters-uiapi';
import {
    DraftManager,
    DraftQueue,
    ProcessActionResult,
    DraftActionOperationType,
} from '@salesforce/lds-drafts';
import { DraftRecordRepresentation } from '@salesforce/lds-drafts/dist/utils/records';
import { JSONStringify } from '../../../utils/language';
import { MockNimbusNetworkAdapter } from '../../MockNimbusNetworkAdapter';
import mockOpportunityObjectInfo from './data/object-Opportunity.json';
import { callbackObserver, flushPromises } from '../../testUtils';
import mockAccount from './data/record-Account-fields-Account.Id,Account.Name.json';
import mockOppy from './data/record-Opportunity-fields-Opportunity.Account.Name,Opportunity.Account.Owner.Name,Opportunity.Owner.City.json';
import { populateL2WithUser, setup, resetLuvioStore } from './integrationTestSetup';
import timekeeper from 'timekeeper';
import {
    DefaultDurableSegment,
    DurableStoreEntry,
    DurableStoreOperationType,
} from '@luvio/environments';
import { ObjectInfoIndex, OBJECT_INFO_PREFIX_SEGMENT } from '../../../utils/ObjectInfoService';
import { restoreDraftKeyMapping } from '../../../utils/restoreDraftKeyMapping';

const RECORD_ID = mockAccount.id;
const API_NAME = 'Account';
const RECORD_TTL = 30000;

describe('mobile runtime integration tests', () => {
    let luvio: Luvio;
    let draftQueue: DraftQueue;
    let draftManager: DraftManager;
    let networkAdapter: MockNimbusNetworkAdapter;
    let createRecord;
    let updateRecord;
    let getRecord;
    let durableStore;
    let luvioDurableStore;

    beforeEach(async () => {
        ({
            luvio,
            draftManager,
            draftQueue,
            networkAdapter,
            createRecord,
            getRecord,
            updateRecord,
            durableStore,
            luvioDurableStore,
        } = await setup());
    });

    async function populateDurableStoreWithAccount() {
        networkAdapter.setMockResponse({
            status: 201,
            headers: {},
            body: JSONStringify(mockAccount),
        });

        const snapshot = await getRecord({
            recordId: RECORD_ID,
            fields: ['Account.Id', 'Account.Name'],
        });
        expect(snapshot.state).toBe('Fulfilled');

        (luvio as any).environment.storeReset();

        return snapshot.data as RecordRepresentation;
    }

    describe('createRecord', () => {
        it('createRecord returns synthetic record', async () => {
            const networkSpy = jest.fn();
            const snapshot = await createRecord({ apiName: API_NAME, fields: { Name: 'Justin' } });
            expect(snapshot.state).toBe('Fulfilled');
            const record = snapshot.data as unknown as DraftRecordRepresentation;
            expect(networkSpy).toHaveBeenCalledTimes(0);
            expect(record.drafts.created).toBe(true);
        });

        it('should throw while creating a draft record of an entity with objectinfo keyPrefix as null', async () => {
            // Arrange
            const apiName = 'NullKeyPrefix';
            const mockDurableStoreEntry: DurableStoreEntry<ObjectInfoIndex> = {
                data: { apiName, keyPrefix: null },
            };
            const mockObjectInfo: DurableStoreEntry<ObjectInfoRepresentation> = {
                data: {
                    ...mockOpportunityObjectInfo,
                    // Set the keyprefix to null
                    keyPrefix: null,
                    apiName,
                },
            };
            const entryObjectInfoKey = keyBuilderObjectInfo({
                apiName,
            });

            await durableStore.batchOperations(
                [
                    {
                        type: DurableStoreOperationType.SetEntries,
                        ids: ['NullKeyPrefix'],
                        segment: OBJECT_INFO_PREFIX_SEGMENT,
                        entries: {
                            ['NullKeyPrefix']: JSON.stringify(mockDurableStoreEntry),
                        },
                    },
                    {
                        type: DurableStoreOperationType.SetEntries,
                        segment: DefaultDurableSegment,
                        ids: [entryObjectInfoKey],
                        entries: {
                            [entryObjectInfoKey]: JSON.stringify(mockObjectInfo),
                        },
                    },
                ],
                ''
            );

            // Act & Assert
            await expect(createRecord({ apiName, fields: { Name: 'Justin' } })).rejects.toEqual({
                body: {
                    message: 'Cannot create draft for entity with null keyPrefix',
                },
                headers: {},
                status: 400,
            });
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

        it('created record does not go stale', async () => {
            const snapshot = await createRecord({ apiName: API_NAME, fields: { Name: 'Justin' } });
            (luvio as any).environment.storeReset();

            timekeeper.travel(Date.now() + RECORD_TTL + 1);

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
            const originalName = 'Justin';
            // create a synthetic record
            const snapshot = await createRecord({
                apiName: API_NAME,
                fields: { Name: originalName },
            });
            const record = snapshot.data;
            const recordId = record.id;
            // call getRecord with synthetic record id
            const getRecordSnapshot = (await getRecord({
                recordId: recordId,
                fields: ['Account.Name', 'Account.Id'],
            })) as Snapshot<RecordRepresentation>;
            expect(getRecordSnapshot.state).toBe('Fulfilled');

            const { waitForCallback, callback } = callbackObserver<any>();
            const callbackSpy = jest.fn().mockImplementation((snapshot) => callback(snapshot));
            // subscribe to getRecord snapshot
            luvio.storeSubscribe(getRecordSnapshot, callbackSpy);

            networkAdapter.setMockResponse({
                status: 201,
                headers: {},
                body: JSONStringify(mockAccount),
            });

            // upload the draft and respond with a record with more fields and a new id
            const result = await draftQueue.processNextAction();
            expect(result).toBe(ProcessActionResult.ACTION_SUCCEEDED);

            await waitForCallback(1);

            expect(callbackSpy).toBeCalledTimes(1);
            // ensure the callback id value has the updated canonical server id
            expect(callbackSpy.mock.calls[0][0].data.fields.Id.value).toBe(RECORD_ID);
        });

        it('created record has future drafts still applied after draft is uploaded', async () => {
            const originalName = mockAccount.fields.Name.value;
            const updatedName = 'Jason';
            // create a synthetic record
            const snapshot = await createRecord({
                apiName: API_NAME,
                fields: { Name: originalName },
            });
            const record = snapshot.data;
            const recordId = record.id;

            await updateRecord({ recordId: recordId, fields: { Name: updatedName } });

            networkAdapter.setMockResponse({
                status: 201,
                headers: {},
                body: JSONStringify(mockAccount),
            });

            // upload the draft and respond with a record with more fields and a new id
            const result = await draftQueue.processNextAction();
            await flushPromises();
            expect(result).toBe(ProcessActionResult.ACTION_SUCCEEDED);

            const updatedRecord = (
                await getRecord({
                    recordId: recordId,
                    fields: ['Account.Name', 'Account.Id'],
                })
            ).data as DraftRecordRepresentation;

            expect(updatedRecord.fields['Name'].value).toEqual(updatedName);
            expect(updatedRecord.drafts.created).toBe(false);
            expect(updatedRecord.drafts.edited).toBe(true);
            expect(updatedRecord.drafts.draftActionIds.length).toBe(1);
        });

        it('creates a create item in queue visible by draft manager', async () => {
            await createRecord({ apiName: API_NAME, fields: { Name: 'Justin' } });
            const subject = await draftManager.getQueue();
            expect(subject.items.length).toBe(1);
            expect(subject.items[0]).toMatchObject({
                operationType: DraftActionOperationType.Create,
            });
        });

        it('creates a record making it a child of an existing record', async () => {
            // populate DS with existing Account
            const account = await populateDurableStoreWithAccount();
            // create a draft Opportunity with OwnerId set to the existing Account
            const createdOppy = (
                await createRecord({
                    apiName: 'Opportunity',
                    fields: { Name: 'Fabulous Oppy', OwnerId: account.id },
                })
            ).data as RecordRepresentation;
            // call getRecord on the draft Opportunity and request Owner.Name
            const oppySnap = await getRecord({
                recordId: createdOppy.id,
                fields: ['Opportunity.Name', 'Opportunity.OwnerId'],
            });
            // expect the snapshot to be fulfilled
            expect(oppySnap.state).toBe('Fulfilled');

            // subscribe to snapshot
            const { waitForCallback, callback } = callbackObserver<any>();
            const getRecordSpy = jest.fn().mockImplementation((snapshot) => callback(snapshot));
            luvio.storeSubscribe(oppySnap, getRecordSpy);
            // process next draft queue item
            networkAdapter.setMockResponse({
                status: 201,
                headers: {},
                body: JSONStringify(mockOppy),
            });

            await draftQueue.processNextAction();

            const canonicalOppyId = mockOppy.id;

            await waitForCallback(1);

            // expect snapshot to be called back with updated ids
            expect(getRecordSpy).toHaveBeenCalledTimes(1);
            const callbackOppy = getRecordSpy.mock.calls[0][0].data as RecordRepresentation;
            expect(callbackOppy.id).toEqual(canonicalOppyId);
        });

        it('creates a record making it a child of another draft record', async () => {
            // create a draft Account
            const account = (
                await createRecord({
                    apiName: API_NAME,
                    fields: { Name: 'Cool Account' },
                })
            ).data as RecordRepresentation;
            // create a draft Opportunity with OwnerId set to the draft Account
            const oppy = (
                await createRecord({
                    apiName: 'Opportunity',
                    fields: { Name: 'Fabulous Oppy', AccountId: account.id },
                })
            ).data as RecordRepresentation;
            // call getRecord on the draft Opportunity and request Owner.Name
            // call getRecord on the draft Opportunity and request Owner.Name
            const oppySnap = await getRecord({
                recordId: oppy.id,
                fields: ['Opportunity.Name', 'Opportunity.AccountId'],
            });
            // expect the snapshot to be fulfilled
            expect(oppySnap.state).toBe('Fulfilled');

            // subscribe to snapshot
            const { waitForCallback, callback } = callbackObserver<any>();
            const getRecordSpy = jest.fn().mockImplementation((snapshot) => callback(snapshot));
            luvio.storeSubscribe(oppySnap, getRecordSpy);

            // process next draft action to create the parent account
            networkAdapter.setMockResponse({
                status: 201,
                headers: {},
                body: JSONStringify(mockAccount),
            });
            // process next draft queue item
            await draftQueue.processNextAction();

            // flush
            await waitForCallback(1);

            const canonicalRecordId = mockAccount.id;
            // expect snapshot to be called back with ids updated
            expect(getRecordSpy).toHaveBeenCalledTimes(1);
            const callbackOppy = getRecordSpy.mock.calls[0][0].data as RecordRepresentation;
            expect(callbackOppy.fields['AccountId'].value).toBe(canonicalRecordId);
        });

        it('create a record with a reference field', async () => {
            const parent = await populateL2WithUser();
            const oppy = (
                await createRecord({
                    apiName: 'Account',
                    fields: { Name: 'My Accout', ParentId: parent.id },
                })
            ).data as RecordRepresentation;

            expect(oppy.fields['ParentId'].value).toEqual(parent.id);

            const spanningSnapshot = await getRecord({
                recordId: oppy.id,
                fields: ['Opportunity.Id', 'Opportunity.Parent.City'],
            });
            expect(spanningSnapshot.state).toBe('Fulfilled');
            const record = spanningSnapshot.data as RecordRepresentation;
            expect(
                (record.fields['Parent'].value as RecordRepresentation).fields['City'].value
            ).toEqual(parent.fields['City'].value);
        });

        it('synthetic record with stale reference does not refresh', async () => {
            const parent = await populateL2WithUser();
            const oppy = (
                await createRecord({
                    apiName: 'Account',
                    fields: { Name: 'My Account', ParentId: parent.id },
                })
            ).data as RecordRepresentation;

            const spy = jest.spyOn(networkAdapter, 'sendRequest');

            expect(oppy.fields['ParentId'].value).toEqual(parent.id);

            timekeeper.travel(Date.now() + RECORD_TTL + 1);

            const spanningSnapshot = await getRecord({
                recordId: oppy.id,
                fields: ['Opportunity.Id', 'Opportunity.Parent.City'],
            });
            expect(spanningSnapshot.state).toBe('Stale');
            const record = spanningSnapshot.data as RecordRepresentation;
            expect(
                (record.fields['Parent'].value as RecordRepresentation).fields['City'].value
            ).toEqual(parent.fields['City'].value);

            expect(spy).toBeCalledTimes(0);
        });

        it('draft removed from durable store after uploaded', async () => {
            const originalName = 'Justin';
            // create a synthetic record
            const snapshot = await createRecord({
                apiName: API_NAME,
                fields: { Name: originalName },
            });

            const record = snapshot.data;
            const draftRecordId = record.id;
            const key = keyBuilderRecord({ recordId: draftRecordId });

            const foundEntries = await durableStore.getEntriesInSegment([key], 'DEFAULT');
            expect(foundEntries.isMissingEntries).toEqual(false);

            networkAdapter.setMockResponse({
                status: 201,
                headers: {},
                body: JSONStringify(mockAccount),
            });

            // upload the draft and respond with a record with more fields and a new id
            await draftQueue.processNextAction();
            await flushPromises();

            // draft removed from durable store
            const missingEntry = await durableStore.getEntriesInSegment([key], 'DEFAULT');
            expect(missingEntry.isMissingEntries).toEqual(true);

            // draft still accessible using draft id
            const snap = await getRecord({
                recordId: draftRecordId,
                fields: ['Account.Name', 'Account.Id'],
            });
            expect(snap.state).toBe('Fulfilled');
            // id is now canonical
            expect(snap.data.fields.Id.value).toBe(mockAccount.id);
        });

        it('should restore the redirect mapping in Luvio after a store reset', async () => {
            // ---- Arrange ----

            // create a synthetic record
            const snapshot = await createRecord({
                apiName: API_NAME,
                fields: { Name: 'Id' },
            });

            const record = snapshot.data;
            const draftKeyId = record.id;
            const canonicalKeyId = mockAccount.id;
            const key = keyBuilderRecord({ recordId: draftKeyId });

            const foundEntries = await durableStore.getEntriesInSegment([key], 'DEFAULT');
            expect(foundEntries.isMissingEntries).toEqual(false);

            networkAdapter.setMockResponse({
                status: 201,
                headers: {},
                body: JSONStringify(mockAccount),
            });

            // upload the draft and respond with a record with more fields and a new id
            await draftQueue.processNextAction();
            await flushPromises();

            // draft removed from durable store
            const missingEntry = await durableStore.getEntriesInSegment([key], 'DEFAULT');
            expect(missingEntry.isMissingEntries).toEqual(true);
            // ---- Act ----

            // Reset Luvio
            await resetLuvioStore();
            await restoreDraftKeyMapping(luvio, luvioDurableStore);

            // ---- Assert ----

            // Provide the draft id and check if we get back the record with Canonical id
            const snap = await getRecord({
                recordId: draftKeyId,
                fields: ['Account.Name', 'Account.Id'],
            });

            expect(snap.data.fields.Id.value).toBe(canonicalKeyId);
        });

        it('should only be written to the durable store once', async () => {
            const spy = jest.spyOn(durableStore, 'batchOperations');
            await createRecord({ apiName: API_NAME, fields: { Name: 'Justin' } });
            await flushPromises();

            // once to the draft segment and once to the default segment
            expect(spy).toBeCalledTimes(2);
        });
    });
});
