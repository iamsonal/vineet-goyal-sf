import { testDurableHitDoesNotHitNetwork } from '@salesforce/lds-jest';
import { factory as getRecordAvatarsFactory } from '../index';

import data from './data/avatar-001xx0000000003AAA-001xx0000000004AAA-001xx0000000005AAA.json';
import { MockPayload, buildSuccessMockPayload } from '@ldsjs/adapter-test-library';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath:
        '/ui-api/record-avatars/batch/001xx0000000003AAA,001xx0000000004AAA,001xx0000000005AAA',
};
const payload: MockPayload = buildSuccessMockPayload(requestArgs, data);
describe('getRecordAvatars offline', () => {
    it('returns data from durable store', async () => {
        const config = {
            recordIds: ['001xx0000000003AAA', '001xx0000000004AAA', '001xx0000000005AAA'],
        };

        await testDurableHitDoesNotHitNetwork(getRecordAvatarsFactory, config, payload);
    });
});