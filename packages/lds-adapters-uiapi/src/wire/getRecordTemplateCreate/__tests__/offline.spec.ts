import {
    buildSuccessMockPayload,
    MockPayload,
    buildMockNetworkAdapter,
    getMockNetworkAdapterCallCount,
} from '@luvio/adapter-test-library';
import {
    testDataEmittedWhenStale,
    testDurableHitDoesNotHitNetwork,
    populateDurableStore,
    buildOfflineLuvio,
} from '@salesforce/lds-jest';

import { factory as getRecordTemplateCreate } from '../index';
import { GetRecordTemplateCreateConfig } from '../../../generated/adapters/getRecordTemplateCreate';

import recordTemplateCreate_Custom from './mockData/record-template-create-Custom_Object__c.json';
import { TTL } from '../../../generated/types/RecordDefaultsTemplateCreateRepresentation';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/record-defaults/template/create/${recordTemplateCreate_Custom.record.apiName}`,
};
const recordPayload: MockPayload = buildSuccessMockPayload(
    requestArgs,
    recordTemplateCreate_Custom
);

const configWithRecordTypeId: GetRecordTemplateCreateConfig = {
    objectApiName: recordTemplateCreate_Custom.record.apiName,
    recordTypeId: recordTemplateCreate_Custom.record.recordTypeId,
};

const configNoRecordTypeId: GetRecordTemplateCreateConfig = {
    objectApiName: recordTemplateCreate_Custom.record.apiName,
};

describe('getRecordTemplateCreate adapter offline', () => {
    it('returns stale snapshot when data is expired', async () => {
        await testDataEmittedWhenStale(
            getRecordTemplateCreate,
            configWithRecordTypeId,
            recordPayload,
            TTL
        );
    });

    it('does not hit the network when durable store is populated', async () => {
        await testDurableHitDoesNotHitNetwork(
            getRecordTemplateCreate,
            configWithRecordTypeId,
            recordPayload
        );
    });

    it('should not make another HTTP request when master recordTypeId is also the default master rtId', async () => {
        // populate durable store with config that explicitly sets rtId
        const durableStore = await populateDurableStore(
            getRecordTemplateCreate,
            configWithRecordTypeId,
            recordPayload
        );

        // instantiate new LDS instance with durable environment
        const { luvio, network } = buildOfflineLuvio(
            durableStore,
            buildMockNetworkAdapter([recordPayload])
        );
        const adapter = getRecordTemplateCreate(luvio);

        // call adapter without rtId set
        const result = await (adapter(configNoRecordTypeId) as Promise<any>);
        expect(result.state).toBe('Fulfilled');
        const callCount = getMockNetworkAdapterCallCount(network);
        expect(callCount).toBe(0);
    });
});
