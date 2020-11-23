import response from './data/record-Opportunity-new.json';
import { buildOfflineLds, populateDurableStore } from '@salesforce/lds-jest';
import {
    buildMockNetworkAdapter,
    MockPayload,
    buildSuccessMockPayload,
    getMockNetworkAdapterCallCount,
} from '@luvio/adapter-test-library';

const createArgs: MockPayload['networkArgs'] = {
    method: 'post',
    basePath: '/ui-api/records',
};
const createPayload: MockPayload = buildSuccessMockPayload(createArgs, response);

const config = {
    apiName: 'Opportunity',
    fields: {
        Name: 'Foo',
        StageName: 'Stage',
        CloseDate: '2020-01-01T00:26:58+00:00',
    },
    allowSaveOnDuplicate: false,
};

const OPPORTUNITY_ID = '006xx000001a6JAAAY';

import { factory as createRecordFactory } from '../index';
import { factory as getRecordFactory } from '../../getRecord/index';
import { RecordRepresentation } from '../../../generated/types/RecordRepresentation';
import { Snapshot } from '@luvio/engine';

describe('createRecord offline tests', () => {
    it('getRecord is fullfilled when offline after a createRecord is invoked online', async () => {
        const durableStore = await populateDurableStore(createRecordFactory, config, createPayload);
        const network = buildMockNetworkAdapter([]);
        const { lds } = buildOfflineLds(durableStore, network);
        const adapter = getRecordFactory(lds);
        const snapshot = await (adapter({
            recordId: OPPORTUNITY_ID,
            fields: [
                'Opportunity.CreatedById',
                'Opportunity.AccountId',
                'Opportunity.Amount',
                'Opportunity.CampaignId',
                'Opportunity.CloseDate',
                'Opportunity.CreatedById',
                'Opportunity.Description',
                'Opportunity.CurrentGenerators__c',
                'Opportunity.DeliveryInstallationStatus__c',
                'Opportunity.Description',
                'Opportunity.ExpectedRevenue',
                'Opportunity.IsPrivate',
                'Opportunity.LastModifiedBy.Id',
                'Opportunity.LastModifiedBy.Name',
            ],
        }) as Promise<Snapshot<RecordRepresentation>>);
        expect(snapshot.state).toBe('Fulfilled');
        expect(getMockNetworkAdapterCallCount(network)).toBe(0);
    });
});
