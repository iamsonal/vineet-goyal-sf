import { buildSuccessMockPayload, MockPayload } from '@luvio/adapter-test-library';
import { testDataEmittedWhenStale, testDurableHitDoesNotHitNetwork } from '@salesforce/lds-jest';

import { factory as getMruListUi } from '../index';
import { GetMruListUiConfig } from '../../../generated/adapters/getMruListUi';
import { responseRecordRepresentationRetrievers } from '../../../generated/records/retrievers';

import response from './data/mru-list-ui-Opportunity.json';

// expire the records within list representation
import { TTL } from '../../../generated/types/RecordRepresentation';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/mru-list-ui/${response.info.listReference.objectApiName}`,
};
const payload: MockPayload = buildSuccessMockPayload(requestArgs, response);

const config: GetMruListUiConfig = {
    objectApiName: response.info.listReference.objectApiName,
};

describe('getMruListUi adapter offline', () => {
    it('returns stale snapshot when data is expired', async () => {
        await testDataEmittedWhenStale(
            getMruListUi,
            config,
            payload,
            TTL,
            undefined,
            responseRecordRepresentationRetrievers
        );
    });

    it('does not hit the network when durable store is populated', async () => {
        await testDurableHitDoesNotHitNetwork(
            getMruListUi,
            config,
            payload,
            undefined,
            responseRecordRepresentationRetrievers
        );
    });
});
