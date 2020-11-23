import { buildSuccessMockPayload, MockPayload } from '@luvio/adapter-test-library';
import { testDataEmittedWhenStale, testDurableHitDoesNotHitNetwork } from '@salesforce/lds-jest';

import { factory as getPicklistValues } from '../index';
import picklistResponse from './mockData/picklist-Account-MasterRecordTypeId-fieldApiName-Type.json';
import { TTL } from '../../../generated/types/PicklistValuesRepresentation';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: '/ui-api/object-info/Account/picklist-values/012000000000000AAA/Type',
};
const picklistPayload: MockPayload = buildSuccessMockPayload(requestArgs, picklistResponse);

const config = {
    recordTypeId: '012000000000000AAA',
    fieldApiName: 'Account.Type',
};

describe('getPicklistValues adapter offline', () => {
    it('returns stale snapshot when data is expired', async () => {
        await testDataEmittedWhenStale(getPicklistValues, config, picklistPayload, TTL);
    });

    it('does not hit the network when durable store is populated', async () => {
        await testDurableHitDoesNotHitNetwork(getPicklistValues, config, picklistPayload);
    });
});
