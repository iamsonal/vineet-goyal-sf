import { buildSuccessMockPayload, MockPayload } from '@ldsjs/adapter-test-library';

import { factory as getListViewSummaryCollection } from '../index';
import listUiOpportunity from './mockData/list-ui-Opportunity.json';
import { GetListViewSummaryCollectionConfig } from '../../../generated/adapters/getListViewSummaryCollection';
import { testDurableHitDoesNotHitNetwork } from '@salesforce/lds-jest';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/list-ui/Opportunity`,
};
const recordPayload: MockPayload = buildSuccessMockPayload(requestArgs, listUiOpportunity);

const config: GetListViewSummaryCollectionConfig = {
    objectApiName: 'Opportunity',
};

describe('getListViewSummaryCollection adapter offline', () => {
    it('does not hit the network when durable store is populated', async () => {
        await testDurableHitDoesNotHitNetwork(getListViewSummaryCollection, config, recordPayload);
    });
});
