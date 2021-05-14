import { Luvio, Store, Environment, NetworkAdapter } from '@luvio/engine';
import {
    buildMockNetworkAdapter,
    buildSuccessMockPayload,
    MockPayload,
    MockDurableStore,
    getMockNetworkAdapterCallCount,
} from '@luvio/adapter-test-library';

import { getRecordsPropertyRetriever } from '@salesforce/lds-uiapi-record-utils';

import { responseRecordRepresentationRetrievers } from '../../../generated/records/retrievers';

import { makeDurable, makeOffline } from '@luvio/environments';
import {
    keyBuilder,
    RecordRepresentationNormalized,
} from '../../../generated/types/RecordRepresentation';

import multipleRecordsWithIdName from './mockData/records-multiple-Accounts-fields-Account.Id,Account.Name.json';
import multipleRecordsWithIdNameNickColor from './mockData/records-multiple-Accounts-fields-Account.Id,Account.Name,Account.NickName,Account.Color.json';
import { ObjectKeys } from '../../../generated/types/type-utils';
import { testDurableHitDoesNotHitNetwork } from '@salesforce/lds-jest';
import { getRecordsAdapterFactory } from '../../../generated/adapters/getRecords';

const recordId_Account1 = '001xx000003Gn4WAAS';
const recordId_Account2 = '001xx000003Gn4WAAT';

const recordKey1 = keyBuilder({ recordId: recordId_Account1 });

const recordFields_Account = ['Account.Id', 'Account.Name'];
const batchRecordRequest_Account: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/records/batch/${recordId_Account1},${recordId_Account2}`,
    queryParams: { fields: recordFields_Account },
};
const recordPayload_Account: MockPayload = buildSuccessMockPayload(
    batchRecordRequest_Account,
    multipleRecordsWithIdName
);

function buildLds(durableStore: MockDurableStore, n?: NetworkAdapter) {
    const store = new Store();
    const network = n ?? buildMockNetworkAdapter([recordPayload_Account]);

    const env = makeDurable(makeOffline(new Environment(store, network)), {
        durableStore,
        reviveRetrievers: responseRecordRepresentationRetrievers,
        compositeRetrievers: [getRecordsPropertyRetriever],
    });

    const luvio = new Luvio(env);
    return {
        luvio,
        durableStore,
        network,
        store,
        env,
    };
}

async function populateDurableStore() {
    const { durableStore, luvio, network, env } = buildLds(
        new MockDurableStore(),
        buildMockNetworkAdapter([recordPayload_Account])
    );

    const adapter = getRecordsAdapterFactory(luvio);
    const snapshotOrPromise = adapter({
        records: [
            {
                recordIds: [recordId_Account1, recordId_Account2],
                fields: recordFields_Account,
            },
        ],
    }) as Promise<any>;
    expect(snapshotOrPromise).toBeInstanceOf(Promise);

    const result = await snapshotOrPromise;
    expect(result.state).toEqual('Fulfilled');
    const callCount = getMockNetworkAdapterCallCount(network);
    expect(callCount).toBe(1);

    // dispose DS so on changed listener doesn't keep firing
    env.dispose();

    return durableStore;
}

// This is required because broadcast does not await the write to
// durable store so we need to make sure the microtask queue is emptied
// before checking the durable store for expected result
function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

describe('getRecords with fields offline', () => {
    it('does not hit the network when all fields are in durable store', async () => {
        const config = {
            records: [
                {
                    recordIds: [recordId_Account1, recordId_Account2],
                    fields: recordFields_Account,
                },
            ],
        };
        await testDurableHitDoesNotHitNetwork(
            getRecordsAdapterFactory,
            config,
            recordPayload_Account,
            {
                compositeRetrievers: [getRecordsPropertyRetriever],
            }
        );
    });

    it('merges with fields that are in durable store', async () => {
        const durableStore = await populateDurableStore();

        const request: MockPayload['networkArgs'] = {
            method: 'get',
            basePath: `/ui-api/records/batch/${recordId_Account1},${recordId_Account2}`,
            queryParams: { fields: ['Account.Color', 'Account.Id', 'Account.NickName'] },
        };
        const payload: MockPayload = buildSuccessMockPayload(
            request,
            multipleRecordsWithIdNameNickColor
        );

        const network = buildMockNetworkAdapter([payload]);
        const { luvio, store } = buildLds(durableStore, network);
        // test the record doesn't exist in memory
        expect(store.records[recordKey1]).toBeUndefined();

        const adapter = getRecordsAdapterFactory(luvio);
        const result = await (adapter({
            records: [
                {
                    recordIds: [recordId_Account1, recordId_Account2],
                    fields: ['Account.Id', 'Account.NickName', 'Account.Color'],
                },
            ],
        }) as Promise<any>);
        await flushPromises();

        expect(result.state).toEqual('Fulfilled');

        const mergedFields = ['Id', 'Name', 'NickName', 'Color'];

        const record = store.records[recordKey1] as RecordRepresentationNormalized;
        expect(ObjectKeys(record.fields)).toEqual(mergedFields);

        const durableEntries = await durableStore.getEntries([recordKey1], 'DEFAULT');
        const durableRecord = durableEntries[recordKey1].data as RecordRepresentationNormalized;

        expect(ObjectKeys(durableRecord.fields)).toEqual(mergedFields);
    });
});
