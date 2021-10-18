import { buildSuccessMockPayload, MockPayload } from '@luvio/adapter-test-library';

import { factory as getRecordAdapterFactory } from '../index';

import singleRecordWithIdName from './mockData/record-Account-fields-Account.Id,Account.Name.json';
import { testDurableHitDoesNotHitNetwork } from '@salesforce/lds-jest';
const recordId_Account = '001xx000003Gn4WAAS';
const recordFields_Account = ['Account.Id', 'Account.Name'];
const recordRequest_Account: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/records/${recordId_Account}`,
    queryParams: { fields: recordFields_Account },
};
const recordPayload_Account: MockPayload = buildSuccessMockPayload(
    recordRequest_Account,
    singleRecordWithIdName
);

describe('getRecord with fields offline', () => {
    it('does not hit the network when all fields are in durable store', async () => {
        const config = {
            recordId: recordId_Account,
            fields: recordFields_Account,
        };
        await testDurableHitDoesNotHitNetwork(
            getRecordAdapterFactory,
            config,
            recordPayload_Account
        );
    });
});
