import { buildSuccessMockPayload, MockPayload } from '@luvio/adapter-test-library';
import { testDurableHitDoesNotHitNetwork } from '@salesforce/lds-jest';

import {
    getRelatedListRecordsAdapterFactory as getRelatedListRecords,
    GetRelatedListRecordsConfig,
} from '../../../generated/adapters/getRelatedListRecords';
import { responseRecordRepresentationRetrievers } from '../../../generated/records/retrievers';

import response from './data/list-ui-All-Related-Lists.json';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/related-list-records/${response.listReference.inContextOfRecordId}/${response.listReference.relatedListId}`,
};

const payload: MockPayload = buildSuccessMockPayload(requestArgs, response);

const relatedListRecordsConfig: GetRelatedListRecordsConfig = {
    parentRecordId: response.listReference.inContextOfRecordId,
    relatedListId: response.listReference.relatedListId,
    fields: response.fields,
};

describe('getRelatedListRecords adapter offline', () => {
    it('does not hit the network when durable store is populated', async () => {
        await testDurableHitDoesNotHitNetwork(
            getRelatedListRecords,
            relatedListRecordsConfig,
            payload,
            undefined,
            responseRecordRepresentationRetrievers
        );
    });
});
