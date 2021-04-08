import response from './data/record-User-fields-User.Id,User.Name.json';
import editedResponse from './data/record-User-fields-User.Id,User.Name-edited.json';
import { buildOfflineLuvio, populateDurableStore } from '@salesforce/lds-jest';
import {
    buildMockNetworkAdapter,
    MockPayload,
    buildSuccessMockPayload,
} from '@luvio/adapter-test-library';

import { factory as updateRecordFactory } from '../index';
import { factory as getRecordFactory } from '../../getRecord/index';
import { RecordRepresentation } from '../../../generated/types/RecordRepresentation';
import { Snapshot } from '@luvio/engine';
import { DefaultDurableSegment } from '@luvio/environments';
import { keyBuilder as recordKeyBuilder } from '../../../generated/types/RecordRepresentation';
import { FieldValueRepresentation } from '../../../generated/types/FieldValueRepresentation';

const RECORD_ID = '005xx000001XL1tAAG';
const UPDATED_NAME = 'User Edited';

const getArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/records/${RECORD_ID}`,
};

const updateArgs: MockPayload['networkArgs'] = {
    method: 'patch',
    basePath: `/ui-api/records/${RECORD_ID}`,
    body: {
        fields: {
            Name: UPDATED_NAME,
        },
    },
};

const getConfig = {
    recordId: RECORD_ID,
    fields: ['User.Id', 'User.Name'],
};

const getPayload: MockPayload = buildSuccessMockPayload(getArgs, response);

describe('updateRecord offline tests', () => {
    it('updated record gets persisted to durable store', async () => {
        const durableStore = await populateDurableStore(getRecordFactory, getConfig, getPayload);
        const network = buildMockNetworkAdapter([
            buildSuccessMockPayload(updateArgs, editedResponse),
        ]);
        const { luvio } = buildOfflineLuvio(durableStore, network);
        const adapter = updateRecordFactory(luvio);
        const snapshot = await (adapter({
            recordId: RECORD_ID,
            fields: {
                Name: UPDATED_NAME,
            },
        }) as Promise<Snapshot<RecordRepresentation>>);
        expect(snapshot.state).toBe('Fulfilled');
        const recordKey = recordKeyBuilder({ recordId: RECORD_ID });
        const nameKey = `${recordKey}__fields__Name`;
        const recordSegment = durableStore.segments[DefaultDurableSegment];
        const fieldEntry = recordSegment[nameKey];
        expect((fieldEntry.data as FieldValueRepresentation).value).toBe(UPDATED_NAME);
    });
});
