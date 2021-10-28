import { MockNimbusNetworkAdapter } from '../../MockNimbusNetworkAdapter';
import mockAccount from './data/record-Account-fields-Account.Id,Account.Name.json';
import recordUiResponse from './data/single-record-Account-layouttypes-Full-modes-View.json';
import { JSONStringify } from '../../../utils/language';
import { resetLuvioStore, setup } from './integrationTestSetup';
import { flushPromises } from '../../testUtils';
const RECORD_ID = mockAccount.id;

describe('mobile runtime integration tests', () => {
    let networkAdapter: MockNimbusNetworkAdapter;
    let getRecord;
    let getRecordUi;

    beforeEach(async () => {
        ({ networkAdapter, getRecord, getRecordUi } = await setup());
    });
    describe('getRecordUi', () => {
        it('data gets merged properly', async () => {
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

            const config = {
                recordIds: RECORD_ID,
                layoutTypes: ['Full'],
                modes: ['View'],
                optionalFields: ['Account.Industry'],
            };

            networkAdapter.setMockResponse({
                status: 201,
                headers: {},
                body: JSONStringify(recordUiResponse),
            });

            const uiSnapshot = await getRecordUi(config);

            expect(uiSnapshot.state).toBe('Fulfilled');
            expect(uiSnapshot.data.records[RECORD_ID].fields['Name']).toBeUndefined();

            await flushPromises();
            resetLuvioStore();

            const snapshotFromCache = await getRecord({
                recordId: RECORD_ID,
                fields: ['Account.Name', 'Account.NumberOfEmployees'],
            });

            expect(snapshotFromCache.state).toBe('Fulfilled');
            expect(snapshotFromCache.data.fields['Name'].value).toBe(
                mockAccount.fields['Name'].value
            );
            expect(snapshotFromCache.data.fields['NumberOfEmployees'].value).toBe(
                recordUiResponse.records[RECORD_ID].fields['NumberOfEmployees'].value
            );
        });
    });
});
