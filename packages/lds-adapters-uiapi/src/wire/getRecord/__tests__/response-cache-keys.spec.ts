import { testResponseCacheKeysMatchIngestCacheKeys } from '@salesforce/lds-jest';

import { factory } from '../index';
import { getResponseCacheKeys } from '../../../generated/resources/getUiApiRecordsByRecordId';
import { GetRecordConfig, createResourceParams } from '../../../generated/adapters/getRecord';

import singleRecordWithIdName from './mockData/record-Account-fields-Account.Id,Account.Name.json';
import recordWithNestedFields from './mockData/record-Opportunity-fields-Opportunity.Account.Name,Opportunity.Account.Owner.Name,Opportunity.Owner.City.json';

describe('getRecord getResponseCacheKeys returns same set as adapter network snapshot', () => {
    it('for RecordRep with scalar fields', async () => {
        const config: GetRecordConfig = {
            recordId: singleRecordWithIdName.id,
            fields: Object.keys(singleRecordWithIdName.fields).map((field) => `Account.${field}`),
        };
        const resourceParams = createResourceParams(config);

        await testResponseCacheKeysMatchIngestCacheKeys(
            getResponseCacheKeys,
            factory,
            config,
            resourceParams,
            singleRecordWithIdName
        );
    });

    it('for RecordRep with nested Record fields', async () => {
        const config: GetRecordConfig = {
            recordId: recordWithNestedFields.id,
            fields: [
                'Opportunity.Account.Name',
                'Opportunity.Account.Owner.Name',
                'Opportunity.Owner.City',
                'Opportunity.Name',
            ],
        };
        const resourceParams = createResourceParams(config);

        await testResponseCacheKeysMatchIngestCacheKeys(
            getResponseCacheKeys,
            factory,
            config,
            resourceParams,
            recordWithNestedFields
        );
    });
});
