import { buildSuccessMockPayload, MockPayload } from '@luvio/adapter-test-library';
import { testDataEmittedWhenStale, testDurableHitDoesNotHitNetwork } from '@salesforce/lds-jest';

import { getLayoutUserStateAdapterFactory as getLayoutUserState } from '../../../../generated/adapters/getLayoutUserState';
import response from './data/layoutUserState-Account-Full-View.json';
import { TTL } from '../../../../generated/types/RecordLayoutUserStateRepresentation';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: '/ui-api/layout/Account/user-state',
};
const payload: MockPayload = buildSuccessMockPayload(requestArgs, response);

const config = {
    objectApiName: 'Account',
    layoutType: 'Full',
    mode: 'View',
    recordTypeId: '012000000000000AAA',
};

describe('getLayoutUserState adapter offline', () => {
    it('returns stale snapshot when data is expired', async () => {
        await testDataEmittedWhenStale(getLayoutUserState, config, payload, TTL);
    });

    it('does not hit the network when durable store is populated', async () => {
        await testDurableHitDoesNotHitNetwork(getLayoutUserState, config, payload);
    });
});
