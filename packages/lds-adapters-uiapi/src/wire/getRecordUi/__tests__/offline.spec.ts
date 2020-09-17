import { LDS, Store, isFulfilledSnapshot, Environment } from '@ldsjs/engine';
import {
    buildMockNetworkAdapter,
    buildSuccessMockPayload,
    MockPayload,
    MockDurableStore,
    getMockNetworkAdapterCallCount,
} from '@ldsjs/adapter-test-library';

import { factory as getRecordUiAdapterFactory } from '../index';
import { makeDurableRecordAware } from '../../../environments/makeDurableRecordAware';

import recordUiSingleResponse from './data/single-record-Account-layouttypes-Full-modes-View.json';
import recordUiMultiResponse from './data/multiple-record-Account-layouttypes-Full-modes-View.json';
import { makeDurable, makeOffline } from '@ldsjs/environments';

const single_recordId = Object.keys(recordUiSingleResponse.records)[0];
const recordId_Account1 = Object.keys(recordUiMultiResponse.records)[0];
const recordId_Account2 = Object.keys(recordUiMultiResponse.records)[1];

const sortedRecordIdCSV = [recordId_Account1, recordId_Account2].sort().join(',');

const singleRecordRequest_Account: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/record-ui/${single_recordId}`,
    queryParams: {
        layoutTypes: ['Full'],
        modes: ['View'],
        optionalFields: [],
    },
};
const singleRecordPayload_Account: MockPayload = buildSuccessMockPayload(
    singleRecordRequest_Account,
    recordUiSingleResponse
);

const multiRecordRequest_Account: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/record-ui/${sortedRecordIdCSV}`,
    queryParams: {
        layoutTypes: ['Full'],
        modes: ['View'],
        optionalFields: [],
    },
};
const multiRecordPayload_Account: MockPayload = buildSuccessMockPayload(
    multiRecordRequest_Account,
    recordUiMultiResponse
);

function buildLds(ds?: MockDurableStore) {
    const durableStore = ds ?? new MockDurableStore();
    const network = buildMockNetworkAdapter([
        singleRecordPayload_Account,
        multiRecordPayload_Account,
    ]);
    const store = new Store();
    const env = makeDurableRecordAware(
        makeDurable(makeOffline(new Environment(store, network)), durableStore),
        durableStore,
        store
    );
    const lds = new LDS(env);
    return {
        lds,
        durableStore,
        network,
        store,
        env,
    };
}

async function populateDurableStore(recordIds: string[]) {
    const { durableStore, lds, network } = buildLds();

    const adapter = getRecordUiAdapterFactory(lds);
    const snapshotOrPromise = adapter({
        recordIds,
        layoutTypes: ['Full'],
        modes: ['View'],
    }) as Promise<any>;
    expect(snapshotOrPromise).toBeInstanceOf(Promise);

    const result = await snapshotOrPromise;
    expect(isFulfilledSnapshot(result)).toBe(true);
    const callCount = getMockNetworkAdapterCallCount(network);
    expect(callCount).toBe(1);
    return {
        durableStore,
    };
}

describe('getRecordUi adapter offline', () => {
    describe('singleRecordResponse', () => {
        it('selector gets stored in durable store', async () => {
            const { durableStore } = await populateDurableStore([single_recordId]);
            const selector =
                durableStore.entries[
                    `UiApi::RecordUiRepresentation:${single_recordId}:Full:View:__selector`
                ];
            expect(selector).toBeDefined();
        });

        it('durable cache hit does not hit network', async () => {
            const { durableStore } = await populateDurableStore([single_recordId]);
            const { lds, network } = buildLds(durableStore);
            const adapter = getRecordUiAdapterFactory(lds);
            const snapshotOrPromise = adapter({
                recordIds: [single_recordId],
                layoutTypes: ['Full'],
                modes: ['View'],
            }) as Promise<any>;
            expect(snapshotOrPromise).toBeInstanceOf(Promise);
            const result = await snapshotOrPromise;
            expect(isFulfilledSnapshot(result)).toBe(true);
            const callCount = getMockNetworkAdapterCallCount(network);
            expect(callCount).toBe(0);
        });
    });

    describe('multipleRecordResponse', () => {
        it('selector gets stored in durable store', async () => {
            const { durableStore } = await populateDurableStore([
                recordId_Account1,
                recordId_Account2,
            ]);
            const selector =
                durableStore.entries[
                    `UiApi::RecordUiRepresentation:${sortedRecordIdCSV}:Full:View:__selector`
                ];
            expect(selector).toBeDefined();
        });

        it('durable cache hit does not hit network', async () => {
            const { durableStore } = await populateDurableStore([
                recordId_Account1,
                recordId_Account2,
            ]);
            const { lds, network } = buildLds(durableStore);
            const adapter = getRecordUiAdapterFactory(lds);
            const snapshotOrPromise = adapter({
                recordIds: [recordId_Account1, recordId_Account2],
                layoutTypes: ['Full'],
                modes: ['View'],
            }) as Promise<any>;
            expect(snapshotOrPromise).toBeInstanceOf(Promise);
            const result = await snapshotOrPromise;
            expect(isFulfilledSnapshot(result)).toBe(true);
            const callCount = getMockNetworkAdapterCallCount(network);
            expect(callCount).toBe(0);
        });
    });
});