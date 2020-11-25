import { Luvio, Store, Environment, NetworkAdapter } from '@luvio/engine';
import {
    buildMockNetworkAdapter,
    buildSuccessMockPayload,
    MockPayload,
    MockDurableStore,
    getMockNetworkAdapterCallCount,
} from '@luvio/adapter-test-library';
import { DefaultDurableSegment } from '@luvio/environments';

import { factory as getRecordAdapterFactory } from '../index';
import { responseRecordRepresentationRetrievers } from '../../../generated/records/retrievers';

import { makeDurable, makeOffline } from '@luvio/environments';
import {
    keyBuilder,
    RecordRepresentationNormalized,
} from '../../../generated/types/RecordRepresentation';

import singleRecordWithIdName from './mockData/record-Account-fields-Account.Id,Account.Name.json';
import singleRecordWithIdNickNameColor from './mockData/record-Account-fields-Account.Id,Account.NickName,Account.Color.json';
import { ObjectKeys } from '../../../generated/types/type-utils';
import { testDurableHitDoesNotHitNetwork } from '@salesforce/lds-jest';
const recordId_Account = '001xx000003Gn4WAAS';
const recordKey = keyBuilder({ recordId: recordId_Account });
const recordFields_Account = ['Account.Id', 'Account.Name'];
const recordRequest_Account: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/records/${recordId_Account}`,
    queryParams: { fields: recordFields_Account },
};
const recordPayload_Account: MockPayload = buildSuccessMockPayload(
    recordRequest_Account,
    singleRecordWithIdName
);

function buildLds(durableStore: MockDurableStore, n?: NetworkAdapter) {
    const store = new Store();
    const network = n ?? buildMockNetworkAdapter([recordPayload_Account]);
    const env = makeDurable(
        makeOffline(new Environment(store, network)),
        durableStore,
        responseRecordRepresentationRetrievers
    );
    const luvio = new Luvio(env);
    return {
        lds: luvio,
        durableStore,
        network,
        store,
        env,
    };
}

async function populateDurableStore() {
    const { durableStore, lds, network } = buildLds(
        new MockDurableStore(),
        buildMockNetworkAdapter([recordPayload_Account])
    );

    const adapter = getRecordAdapterFactory(lds);
    const snapshotOrPromise = adapter({
        recordId: recordId_Account,
        fields: recordFields_Account,
    }) as Promise<any>;
    expect(snapshotOrPromise).toBeInstanceOf(Promise);

    const result = await snapshotOrPromise;
    expect(result.state).toEqual('Fulfilled');
    const callCount = getMockNetworkAdapterCallCount(network);
    expect(callCount).toBe(1);
    return durableStore;
}

// This is required because broadcast does not await the write to
// durable store so we need to make sure the microtask queue is emptied
// before checking the durable store for expected result
function flushPromises() {
    return new Promise(resolve => setImmediate(resolve));
}

describe('getRecord with fields offline', () => {
    it('does not hit the network when all fields are in durable store', async () => {
        const config = {
            recordId: recordId_Account,
            fields: recordFields_Account,
        };
        await testDurableHitDoesNotHitNetwork(
            getRecordAdapterFactory,
            config,
            recordPayload_Account
        );
    });

    it('merges with fields that are in durable store', async () => {
        const durableStore = await populateDurableStore();

        const request: MockPayload['networkArgs'] = {
            method: 'get',
            basePath: `/ui-api/records/${recordId_Account}`,
            queryParams: { fields: ['Account.Color', 'Account.Id', 'Account.NickName'] },
        };
        const payload: MockPayload = buildSuccessMockPayload(
            request,
            singleRecordWithIdNickNameColor
        );

        const network = buildMockNetworkAdapter([payload]);
        const { lds, store } = buildLds(durableStore, network);
        // test the record doesn't exist in memory
        expect(store.records[recordKey]).toBeUndefined();

        const adapter = getRecordAdapterFactory(lds);
        const result = await (adapter({
            recordId: recordId_Account,
            fields: ['Account.Id', 'Account.NickName', 'Account.Color'],
        }) as Promise<any>);
        await flushPromises();

        expect(result.state).toEqual('Fulfilled');

        const mergedFields = ['Id', 'Name', 'NickName', 'Color'];

        const record = store.records[recordKey] as RecordRepresentationNormalized;
        expect(ObjectKeys(record.fields)).toEqual(mergedFields);

        const durableRecord = durableStore.segments[DefaultDurableSegment][recordKey]
            .data as RecordRepresentationNormalized;
        expect(ObjectKeys(durableRecord.fields)).toEqual(mergedFields);
    });
});
