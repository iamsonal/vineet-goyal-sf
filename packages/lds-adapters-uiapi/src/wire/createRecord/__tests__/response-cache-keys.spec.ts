import { testResponseCacheKeysMatchIngestCacheKeys } from '@salesforce/lds-jest';

import { factory } from '../index';
import { getResponseCacheKeys } from '../../../generated/resources/postUiApiRecords';
import { CreateRecordConfig, createResourceParams } from '../../../generated/adapters/createRecord';

import recordOpportunity from './data/record-Opportunity-new.json';

describe('createRecord getResponseCacheKeys returns same set as adapter network snapshot', () => {
    it('for RecordRep with scalar fields', async () => {
        const config: CreateRecordConfig = {
            apiName: 'Opportunity',
            fields: {
                Name: 'Foo',
                StageName: 'Stage',
                CloseDate: '2020-01-01T00:26:58+00:00',
            },
            allowSaveOnDuplicate: false,
        };
        const resourceParams = createResourceParams(config);

        await testResponseCacheKeysMatchIngestCacheKeys(
            getResponseCacheKeys,
            factory,
            config,
            resourceParams,
            recordOpportunity
        );
    });
});
