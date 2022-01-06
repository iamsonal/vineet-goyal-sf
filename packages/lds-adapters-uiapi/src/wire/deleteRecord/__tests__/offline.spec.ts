import response from './data/record-User-fields-User.Id,User.Name.json';
import { buildOfflineLuvio, populateDurableStore } from '@salesforce/lds-jest';
import { DefaultDurableSegment } from '@luvio/environments';
import {
    buildMockNetworkAdapter,
    MockPayload,
    buildSuccessMockPayload,
} from '@luvio/adapter-test-library';
import { factory as deleteRecordFactory } from '../index';
import { factory as getRecordFactory } from '../../getRecord/index';
import { keyBuilder as recordKeyBuilder } from '../../../generated/types/RecordRepresentation';

const RECORD_ID = '005xx000001XL1tAAG';

const getArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/records/${RECORD_ID}`,
};

const deleteArgs: MockPayload['networkArgs'] = {
    method: 'delete',
    basePath: `/ui-api/records/${RECORD_ID}`,
};

const getPayload: MockPayload = buildSuccessMockPayload(getArgs, response);
const deletePayload: MockPayload = buildSuccessMockPayload(deleteArgs, {});

const getConfig = {
    recordId: RECORD_ID,
    fields: ['User.Id', 'User.Name'],
};

function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

describe('deleteRecord offline tests', () => {
    it('evicts the entry in durable store', async () => {
        const durableStore = await populateDurableStore(getRecordFactory, getConfig, getPayload);
        const { luvio } = buildOfflineLuvio(durableStore, buildMockNetworkAdapter([deletePayload]));
        const adapter = deleteRecordFactory(luvio);
        await (adapter(RECORD_ID) as Promise<void>);
        await flushPromises();
        const key = recordKeyBuilder({ recordId: RECORD_ID });
        expect((await durableStore.persistence.get(DefaultDurableSegment))[key]).toBeUndefined();
    });
});
