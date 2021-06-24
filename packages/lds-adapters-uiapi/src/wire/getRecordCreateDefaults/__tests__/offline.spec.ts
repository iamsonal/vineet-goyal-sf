import { GetRecordCreateDefaultsConfig } from '../../../generated/adapters/getRecordCreateDefaults';
import { factory as getRecordCreateDefaultsAdapterFactory } from '../index';
import { testDataEmittedWhenStale, testDurableHitDoesNotHitNetwork } from '@salesforce/lds-jest';
import { buildSuccessMockPayload, MockPayload } from '@luvio/adapter-test-library';

import mockData from './data/record-defaults-create-Account-optionalFields-Account.Test.json';

const GetRecordCreateDefaultsRequest: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: '/ui-api/record-defaults/create/Account',
    queryParams: {
        formFactor: 'Large',
        optionalFields: [],
        recordTypeId: '012000000000000AAA',
    },
    urlParams: {
        objectApiName: 'Account',
    },
};

const recordPayload_CreateRecordDefaults: MockPayload = buildSuccessMockPayload(
    GetRecordCreateDefaultsRequest,
    mockData
);

describe('getRecordCreateDefaults with fields offline', () => {
    it('does not hit the network when all fields are in durable store', async () => {
        const config: GetRecordCreateDefaultsConfig = {
            objectApiName: 'Account',
            formFactor: 'Large',
            optionalFields: [],
            recordTypeId: '012000000000000AAA',
        };

        await testDurableHitDoesNotHitNetwork(
            getRecordCreateDefaultsAdapterFactory,
            config,
            recordPayload_CreateRecordDefaults
        );
    });

    it('expires after TTL is passed', async () => {
        const config: GetRecordCreateDefaultsConfig = {
            objectApiName: 'Account',
            formFactor: 'Large',
            optionalFields: [],
            recordTypeId: '012000000000000AAA',
        };

        await testDataEmittedWhenStale(
            getRecordCreateDefaultsAdapterFactory,
            config,
            recordPayload_CreateRecordDefaults,
            900000
        );
    });
});
