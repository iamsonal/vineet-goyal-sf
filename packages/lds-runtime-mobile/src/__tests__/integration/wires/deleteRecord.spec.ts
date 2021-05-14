import { Luvio, Snapshot } from '@luvio/engine';
import {
    createRecordAdapterFactory,
    deleteRecordAdapterFactory,
    getRecordAdapterFactory,
    RecordRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { DraftManager, DraftQueue, DraftActionOperationType } from '@salesforce/lds-drafts';
import { DraftRecordRepresentation } from '@salesforce/lds-drafts/dist/utils/records';
import { JSONStringify } from '../../../utils/language';
import { MockNimbusDurableStore, mockNimbusStoreGlobal } from '../../MockNimbusDurableStore';
import { MockNimbusNetworkAdapter, mockNimbusNetworkGlobal } from '../../MockNimbusNetworkAdapter';
import mockAccount from './data/record-Account-fields-Account.Id,Account.Name.json';
import { ObjectInfoIndex, OBJECT_INFO_PREFIX_SEGMENT } from '../../../utils/ObjectInfoService';
import { DurableStoreEntry } from '@luvio/environments';

const RECORD_ID = mockAccount.id;
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

describe('mobile runtime integration tests', () => {
    let luvio: Luvio;
    let draftQueue: DraftQueue;
    let draftManager: DraftManager;
    let networkAdapter: MockNimbusNetworkAdapter;
    let durableStore: MockNimbusDurableStore;
    let createRecord;
    let deleteRecord;
    let getRecord;

    beforeEach(async () => {
        durableStore = new MockNimbusDurableStore();
        mockNimbusStoreGlobal(durableStore);

        networkAdapter = new MockNimbusNetworkAdapter();
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
            const accountObjectInfo: DurableStoreEntry<ObjectInfoIndex> = {
                data: { apiName: API_NAME, keyPrefix: '001' },
            };
            durableStore.setEntriesInSegment(
                {
                    [API_NAME]: JSON.stringify(accountObjectInfo),
                },
                OBJECT_INFO_PREFIX_SEGMENT
            );

            const snapshot = await createRecord({
                apiName: API_NAME,
                fields: { Name: 'TestRecord' },
            });

            const createdRecord = snapshot.data as unknown as DraftRecordRepresentation;
            expect(snapshot.data.drafts.deleted).toBe(false);

            const getNewRecordSnapshot = (await getRecord({
                recordId: createdRecord.id,
                fields: ['Account.Name'],
            })) as Snapshot<RecordRepresentation>;

            const newRecord = getNewRecordSnapshot.data as unknown as DraftRecordRepresentation;
            expect(newRecord.drafts.deleted).toBe(false);

            // delete the record
            await deleteRecord(newRecord.id);

            const getRecordSnapshot = (await getRecord({
                recordId: newRecord.id,
                fields: ['Account.Name'],
            })) as Snapshot<RecordRepresentation>;

            const deletedRecord = getRecordSnapshot.data as unknown as DraftRecordRepresentation;
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
});
