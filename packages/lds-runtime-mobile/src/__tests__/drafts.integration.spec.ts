import { LDS, Snapshot } from '@ldsjs/engine';
import {
    createRecordAdapterFactory,
    getRecordAdapterFactory,
    RecordRepresentation,
    updateRecordAdapterFactory,
} from '@salesforce/lds-adapters-uiapi';
import { DraftQueue, DraftRecordRepresentation } from '@salesforce/lds-drafts';
import { JSONStringify } from '../utils/language';
import { MockNimbusDurableStore, mockNimbusStoreGlobal } from './MockNimbusDurableStore';
import { MockNimbusAdapter, mockNimbusNetworkGlobal } from './MockNimbusNetworkAdapter';
const RECORD_ID = '005xx000001XL1tAAG';
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
    let lds: LDS;
    let draftQueue: DraftQueue;
    let networkAdapter: MockNimbusAdapter;
    let durableStore: MockNimbusDurableStore;
    let createRecord;
    let updateRecord;
    let getRecord;

    beforeEach(async () => {
        durableStore = new MockNimbusDurableStore();
        mockNimbusStoreGlobal(durableStore);

        networkAdapter = new MockNimbusAdapter();
        mockNimbusNetworkGlobal(networkAdapter);

        const runtime = await import('../main');
        lds = runtime.lds;
        draftQueue = runtime.draftQueue;
        (lds as any).environment.store.reset();

        createRecord = createRecordAdapterFactory(lds);
        updateRecord = updateRecordAdapterFactory(lds);
        getRecord = getRecordAdapterFactory(lds);
    });

    it('createRecord returns synthetic record', async () => {
        const networkSpy = jest.fn();
        networkAdapter.sendRequest = networkSpy;
        const snapshot = await createRecord({ apiName: API_NAME, fields: { Name: 'Justin' } });
        expect(snapshot.state).toBe('Fulfilled');
        const record = (snapshot.data as unknown) as DraftRecordRepresentation;
        expect(networkSpy).toHaveBeenCalledTimes(0);
        expect(record.drafts.created).toBe(true);
    });

    it('getRecord updates when draft change to synthetic record is made', async () => {
        const orginalName = 'Justin';
        const updatedName = 'Jason';
        // create a synthetic record
        const snapshot = await createRecord({ apiName: API_NAME, fields: { Name: orginalName } });
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
        lds.storeSubscribe(getRecordSnapshot, callbackSpy);

        // update the synthetic record
        await updateRecord({ recordId, fields: { Name: updatedName } });

        // ensure the getRecord callback was invoked
        expect(callbackSpy).toBeCalledTimes(1);
        // ensure the getRecord callback was invoked with updated draft data value
        expect(callbackSpy.mock.calls[0][0].data.fields.Name.value).toBe(updatedName);
        expect(callbackSpy.mock.calls[0][0].data.drafts.serverValues.Name.value).toBe(orginalName);
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
        lds.storeSubscribe(snapshot, getRecordCallbackSpy);

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
});
