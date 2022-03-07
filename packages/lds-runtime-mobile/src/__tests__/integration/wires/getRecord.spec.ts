import { Snapshot, HttpStatusCode } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { CompositeResponseEnvelope } from '../../../network/record-field-batching/utils';
import { MockNimbusNetworkAdapter } from '../../MockNimbusNetworkAdapter';
import mockAccount from './data/record-Account-fields-Account.Id,Account.Name.json';
import recordResponse from './data/record-User-fields-User.Id,User.City.json';
import { generateMockedRecordFields } from '../../../network/record-field-batching/__tests__/testUtils';
import { JSONStringify } from '../../../utils/language';
import { clone, flushPromises } from '../../testUtils';
import { setup } from './integrationTestSetup';
const RECORD_ID = mockAccount.id;
const API_NAME = mockAccount.apiName;

describe('mobile runtime integration tests', () => {
    let networkAdapter: MockNimbusNetworkAdapter;
    let getRecord;
    let createRecord;

    beforeEach(async () => {
        ({ networkAdapter, getRecord, createRecord } = await setup());
    });
    describe('getRecord', () => {
        it('return data correctly when fields are batched', async () => {
            // mock up the network response
            const responseChunk1 = clone(mockAccount);
            delete responseChunk1.fields.Name;

            const responseChunk2 = clone(mockAccount);
            delete responseChunk2.fields.Id;

            const mockCompositeResponse: CompositeResponseEnvelope<RecordRepresentation> = {
                compositeResponse: [
                    { body: responseChunk1, httpStatusCode: HttpStatusCode.Ok },
                    { body: responseChunk2, httpStatusCode: HttpStatusCode.Ok },
                ],
            };

            // Set the mock response
            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(mockCompositeResponse),
            });

            const getRecordConfig = {
                recordId: RECORD_ID,
                optionalFields: [
                    `${API_NAME}.Id`,
                    `${API_NAME}.Name`,
                    ...generateMockedRecordFields(500).map((field) => `${API_NAME}.${field}`),
                ],
            };

            const getRecordSnapshot = (await getRecord(
                getRecordConfig
            )) as Snapshot<RecordRepresentation>;

            expect(getRecordSnapshot.state).toBe('Fulfilled');
            const record = getRecordSnapshot.data;
            expect(record.fields).toEqual(mockAccount.fields);
        });

        it('calling getRecord on a draft with missing optionalFields returns what we have stored', async () => {
            const snapshot = await createRecord({
                apiName: API_NAME,
                fields: { Name: 'Justin' },
            });
            await flushPromises();

            const record = await getRecord({
                recordId: snapshot.data.id,
                optionalFields: ['Account.Name', 'Account.Phone'],
            });
            expect(record.state).toBe('Fulfilled');
            expect(record.data.fields.Name).toEqual({
                displayValue: 'Justin',
                value: 'Justin',
            });
            expect(record.missingPaths).toEqual({});
            expect(record.data.fields.Phone).toBeUndefined();
            await flushPromises();
        });

        it('calling getRecord on a draft with missing fields returns error snapshot', async () => {
            const snapshot = await createRecord({
                apiName: API_NAME,
                fields: { Name: 'Justin' },
            });

            const record = await getRecord({
                recordId: snapshot.data.id,
                fields: ['Account.Name', 'Account.Phone'],
            });
            expect(record.state).toBe('Error');
            expect(record.error.body.message).toEqual(
                'Required field is missing from draft created record'
            );
        });

        it('calls get record with background priority', async () => {
            networkAdapter.setMockResponse({
                body: JSONStringify(recordResponse),
                status: 200,
                headers: {},
            });

            const record = await getRecord(
                {
                    recordId: recordResponse.id,
                    optionalFields: ['User.Id'],
                },
                { priority: 'background' }
            );

            expect(record.state).toBe('Fulfilled');
            expect(networkAdapter.sentRequests.length).toBe(1);
            expect(networkAdapter.sentRequests[0].priority).toBe('background');
        });
    });
});
