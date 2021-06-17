import { buildSuccessMockPayload, MockPayload } from '@luvio/adapter-test-library';

import multipleRecordsWithIdName from './mockData/records-multiple-Accounts-fields-Account.Id,Account.Name.json';
import { testDurableHitDoesNotHitNetwork } from '@salesforce/lds-jest';
import { getRecordsAdapterFactory } from '../../../generated/adapters/getRecords';

const recordId_Account1 = '001xx000003Gn4WAAS';
const recordId_Account2 = '001xx000003Gn4WAAT';

const recordFields_Account = ['Account.Id', 'Account.Name'];
const batchRecordRequest_Account: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/records/batch/${recordId_Account1},${recordId_Account2}`,
    queryParams: { fields: recordFields_Account },
};
const recordPayload_Account: MockPayload = buildSuccessMockPayload(
    batchRecordRequest_Account,
    multipleRecordsWithIdName
);

describe('getRecords with fields offline', () => {
    it('does not hit the network when all fields are in durable store', async () => {
        const config = {
            records: [
                {
                    recordIds: [recordId_Account1, recordId_Account2],
                    fields: recordFields_Account,
                },
            ],
        };
        await testDurableHitDoesNotHitNetwork(
            getRecordsAdapterFactory,
            config,
            recordPayload_Account
        );
    });
});
