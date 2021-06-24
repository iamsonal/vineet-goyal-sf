import { Luvio, Snapshot } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import {
    DraftManager,
    DraftQueue,
    ProcessActionResult,
    DraftActionOperationType,
} from '@salesforce/lds-drafts';
import { DraftRecordRepresentation } from '@salesforce/lds-drafts/dist/utils/records';
import { JSONStringify } from '../../../utils/language';
import { MockNimbusNetworkAdapter } from '../../MockNimbusNetworkAdapter';
import { flushPromises } from '../../testUtils';
import mockAccount from './data/record-Account-fields-Account.Id,Account.Name.json';
import mockOppy from './data/record-Opportunity-fields-Opportunity.Account.Name,Opportunity.Account.Owner.Name,Opportunity.Owner.City.json';
import { setup } from './integrationTestSetup';

const RECORD_ID = mockAccount.id;
const API_NAME = 'Account';

describe('mobile runtime integration tests', () => {
    let luvio: Luvio;
    let draftQueue: DraftQueue;
    let draftManager: DraftManager;
    let networkAdapter: MockNimbusNetworkAdapter;
    let createRecord;
    let getRecord;

    beforeEach(async () => {
        ({ luvio, draftManager, draftQueue, networkAdapter, createRecord, getRecord } =
            await setup());
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
        await flushPromises();

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

            // TODO: W-9463628 this flush can be removed when we solve the extra durable writes due to this bug
            await flushPromises();

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

            await flushPromises();
            // subscribe to snapshot
            const getRecordSpy = jest.fn();
            luvio.storeSubscribe(oppySnap, getRecordSpy);
            // process next draft queue item
            networkAdapter.setMockResponse({
                status: 201,
                headers: {},
                body: JSONStringify(mockOppy),
            });

            await draftQueue.processNextAction();

            await flushPromises();

            const canonicalOppyId = mockOppy.id;

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

            await flushPromises();
            // subscribe to snapshot
            const getRecordSpy = jest.fn();
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
            await flushPromises();

            const canonicalRecordId = mockAccount.id;
            // expect snapshot to be called back with ids updated
            expect(getRecordSpy).toHaveBeenCalledTimes(1);
            const callbackOppy = getRecordSpy.mock.calls[0][0].data as RecordRepresentation;
            expect(callbackOppy.fields['AccountId'].value).toBe(canonicalRecordId);
        });
    });
});
