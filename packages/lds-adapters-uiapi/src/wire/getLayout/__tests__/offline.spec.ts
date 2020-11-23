import { buildSuccessMockPayload, MockPayload } from '@luvio/adapter-test-library';

import { factory as getLayoutAdapterFactory } from '../index';
import layoutOpportunityFull from './mockData/layout-Opportunity-Full.json';
import { TTL } from '../../../generated/types/RecordLayoutRepresentation';
import { testDataEmittedWhenStale, testDurableHitDoesNotHitNetwork } from '@salesforce/lds-jest';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/layout/Opportunity`,
};
const recordPayload: MockPayload = buildSuccessMockPayload(requestArgs, layoutOpportunityFull);

const config = {
    objectApiName: 'Opportunity',
    layoutType: 'Full',
    mode: 'View',
    recordTypeId: '012000000000000AAA',
};

describe('getLayout adapter offline', () => {
    it('returns stale snapshot when data is expired', async () => {
        await testDataEmittedWhenStale(getLayoutAdapterFactory, config, recordPayload, TTL);
    });

    it('does not hit the network when durable store is populated', async () => {
        await testDurableHitDoesNotHitNetwork(getLayoutAdapterFactory, config, recordPayload);
    });
});
