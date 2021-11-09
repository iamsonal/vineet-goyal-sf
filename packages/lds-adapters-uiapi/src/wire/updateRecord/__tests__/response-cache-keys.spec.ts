import { testResponseCacheKeysMatchIngestCacheKeys } from '@salesforce/lds-jest';

import { factory } from '../index';
import { getResponseCacheKeys } from '../../../generated/resources/patchUiApiRecordsByRecordId';
import { UpdateRecordConfig, createResourceParams } from '../../../generated/adapters/updateRecord';

import recordUser from './data/record-User-fields-User.Id,User.Name-edited.json';

describe('updateRecord getResponseCacheKeys returns same set as adapter network snapshot', () => {
    it('for RecordRep with scalar fields', async () => {
        const config: UpdateRecordConfig = {
            recordId: recordUser.id,
            fields: {
                Name: recordUser.fields.Name.value,
            },
        };
        const resourceParams = createResourceParams(config);

        await testResponseCacheKeysMatchIngestCacheKeys(
            getResponseCacheKeys,
            factory,
            config,
            resourceParams,
            recordUser
        );
    });
});
