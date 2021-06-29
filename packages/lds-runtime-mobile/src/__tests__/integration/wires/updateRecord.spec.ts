import timekeeper from 'timekeeper';
import { Luvio, Snapshot } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { DraftManager, DraftQueue, DraftActionOperationType } from '@salesforce/lds-drafts';
import { JSONStringify } from '../../../utils/language';
import { MockNimbusNetworkAdapter } from '../../MockNimbusNetworkAdapter';
import { flushPromises } from '../../testUtils';
import mockAccount from './data/record-Account-fields-Account.Id,Account.Name.json';
import mockOpportunity from './data/record-Opportunity-fields-Opportunity.Account.Name,Opportunity.Account.Owner.Name,Opportunity.Owner.City.json';
import { RECORD_TTL } from '@salesforce/lds-adapters-uiapi/karma/dist/uiapi-constants';
import { populateL2WithUser, setup } from './integrationTestSetup';

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
    let createRecord;
    let getRecord;
    let updateRecord;

    beforeEach(async () => {
        ({
            luvio,
            draftManager,
            draftQueue,
            networkAdapter,
            createRecord,
            updateRecord,
            getRecord,
        } = await setup());
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

            // TODO: W-9463628 this flush can be removed when we solve the extra durable writes due to this bug
            await flushPromises();

            const callbackSpy = jest.fn();
            // subscribe to getRecord snapshot
            luvio.storeSubscribe(getRecordSnapshot, callbackSpy);

            // update the synthetic record
            await updateRecord({ recordId, apiName: API_NAME, fields: { Name: updatedName } });

            expect(callbackSpy).toBeCalledTimes(1);
            // ensure the getRecord callback was invoked with updated draft data value
            expect(callbackSpy.mock.calls[0][0].data.fields.Name.value).toBe(updatedName);
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

            /**
             * This test has more snapshot callbacks than expected because
             * of how luvio handles opaque fields in snapshots. This should be
             * fixed in a future version and this count should go down to 2
             * Created story W-9099112 to address this in the future
             */
            expect(getRecordCallbackSpy).toBeCalledTimes(3);

            expect(getRecordCallbackSpy.mock.calls[0][0].data.fields.Name.value).toBe(
                draftOneNameValue
            );
            expect(getRecordCallbackSpy.mock.calls[0][0].data.drafts.edited).toBe(true);

            expect(getRecordCallbackSpy.mock.calls[1][0].data.fields.Name.value).toBe(
                draftOneNameValue
            );
            expect(getRecordCallbackSpy.mock.calls[1][0].data.drafts.edited).toBe(true);

            expect(getRecordCallbackSpy.mock.calls[2][0].data.fields.Name.value).toBe(
                draftTwoNameValue
            );
            expect(getRecordCallbackSpy.mock.calls[2][0].data.drafts.edited).toBe(true);
            expect(getRecordCallbackSpy.mock.calls[2][0].data.drafts.serverValues.Name.value).toBe(
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

            /**
             * This test has more snapshot callbacks than expected because
             * of how luvio handles opaque fields in snapshots. This should be
             * fixed in a future version and this count should go down to 4
             * Created story W-9099112 to address this in the future
             */
            expect(getRecordCallbackSpy).toBeCalledTimes(6);

            // should still contain the second draft data
            expect(getRecordCallbackSpy.mock.calls[3][0].data.fields.Name.value).toBe(
                draftTwoNameValue
            );
            expect(getRecordCallbackSpy.mock.calls[3][0].data.drafts.edited).toBe(true);

            // the server value should be updated
            expect(getRecordCallbackSpy.mock.calls[5][0].data.drafts.serverValues.Name.value).toBe(
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

            const recordCallbacks = getRecordCallbackSpy.mock.calls;

            // callback should not contain drafts anymore
            expect(recordCallbacks[recordCallbacks.length - 1][0].data.fields.Name.value).toBe(
                updatedNameValue
            );
            expect(
                getRecordCallbackSpy.mock.calls[recordCallbacks.length - 1][0].data.drafts
            ).toBeUndefined();
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

        it('update to reference field causes spanning record to be updated', async () => {
            const newOwner = await populateL2WithUser();

            const opportunityId = mockOpportunity.id;
            const updatedOwnerId = newOwner.id;

            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(mockOpportunity),
            });

            const getRecordSnapshot = (await getRecord({
                recordId: opportunityId,
                fields: ['Opportunity.OwnerId', 'Opportunity.Owner.Id', 'Opportunity.Owner.City'],
            })) as Snapshot<RecordRepresentation>;
            expect(getRecordSnapshot.state).toBe('Fulfilled');

            // TODO: W-9463628 this flush can be removed when we solve the extra durable writes due to this bug
            await flushPromises();

            const callbackSpy = jest.fn();
            // subscribe to getRecord snapshot
            luvio.storeSubscribe(getRecordSnapshot, callbackSpy);

            // update the synthetic record
            await updateRecord({ recordId: opportunityId, fields: { OwnerId: updatedOwnerId } });

            await flushPromises();

            // TODO: W-9463628 extra emit, should be 1
            expect(callbackSpy).toBeCalledTimes(2);
            const updatedOppy = callbackSpy.mock.calls[1][0].data as RecordRepresentation;
            expect(updatedOppy.fields['OwnerId'].value).toBe(updatedOwnerId);
            const updatedSpanning = updatedOppy.fields['Owner'].value as RecordRepresentation;
            expect(updatedSpanning.id).toBe(updatedOwnerId);
            expect(updatedSpanning.fields['City'].value).toBe('Montreal');
        });

        it('returns an error when getRecord returns Snapshot in Error state', async () => {
            networkAdapter.setMockResponse({
                status: 404,
                headers: {},
                body: undefined,
            });

            await expect(
                updateRecord({
                    recordId: RECORD_ID,
                    apiName: API_NAME,
                    fields: { Name: 'mockNameUpdate' },
                })
            ).rejects.toEqual({
                body: {
                    errorCode: 'DRAFT_ERROR',
                    message: 'cannot apply a draft to a record that is not cached',
                },
                headers: {},
                status: 400,
            });
        });
    });
});
