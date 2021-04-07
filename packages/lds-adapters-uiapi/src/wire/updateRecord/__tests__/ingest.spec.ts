import response from './data/record-User-fields-User.Id,User.Name.json';
import {
    buildMockNetworkAdapter,
    MockPayload,
    buildSuccessMockPayload,
} from '@luvio/adapter-test-library';

import { factory as updateRecordFactory } from '../index';
import { factory as getRecordFactory } from '../../getRecord/index';
import { Environment, Luvio, Store } from '@luvio/engine';

const RECORD_ID = response.id;

const getArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/records/${RECORD_ID}`,
};

const updateArgs: MockPayload['networkArgs'] = {
    method: 'patch',
    basePath: `/ui-api/records/${RECORD_ID}`,
    body: {
        fields: {
            Id: RECORD_ID,
        },
    },
};

const getConfig = {
    recordId: RECORD_ID,
    fields: ['User.Id', 'User.Name'],
};

function clone(data: any) {
    return JSON.parse(JSON.stringify(data));
}

describe('ingest record', () => {
    it('ingest record with empty fields', async () => {
        const updateRecordResp = clone(response);
        // empty fields
        updateRecordResp.fields = {};
        const newWeakEtag = updateRecordResp.weakEtag + 1;
        updateRecordResp.weakEtag = newWeakEtag;

        const refetchRecordResp = clone(response);
        refetchRecordResp.weakEtag = newWeakEtag;

        const network = buildMockNetworkAdapter([
            // request for priming record
            buildSuccessMockPayload(getArgs, response),
            // update record request
            buildSuccessMockPayload(updateArgs, updateRecordResp),
            // getRecord request for merge conficts
            buildSuccessMockPayload(getArgs, refetchRecordResp),
        ]);

        const store = new Store();
        const luvio = new Luvio(new Environment(store, network));
        const getRecord = getRecordFactory(luvio);
        const updateRecord = updateRecordFactory(luvio);

        // prime record in cache
        await getRecord(getConfig);

        const snapshot = await updateRecord({
            recordId: RECORD_ID,
            fields: {
                Id: RECORD_ID,
            },
        });

        expect(snapshot.state).toBe('Fulfilled');
    });
});
