import timekeeper from 'timekeeper';
import { LDS, Store, Environment } from '@ldsjs/engine';
import { makeDurable, makeOffline } from '@ldsjs/environments';
import {
    buildMockNetworkAdapter,
    buildSuccessMockPayload,
    MockPayload,
    MockDurableStore,
    getMockNetworkAdapterCallCount,
} from '@ldsjs/adapter-test-library';

import { factory as getPicklistValues } from '../index';
import picklistResponse from './mockData/picklist-Account-MasterRecordTypeId-fieldApiName-Type.json';
import { TTL } from '../../../generated/types/PicklistValuesRepresentation';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: '/ui-api/object-info/Account/picklist-values/012000000000000AAA/Type',
};
const picklistPayload: MockPayload = buildSuccessMockPayload(requestArgs, picklistResponse);

const config = {
    recordTypeId: '012000000000000AAA',
    fieldApiName: 'Account.Type',
};

function buildLds(durableStore: MockDurableStore) {
    const network = buildMockNetworkAdapter([picklistPayload]);
    const store = new Store();
    const env = makeDurable(makeOffline(new Environment(store, network)), durableStore);
    const lds = new LDS(env);
    return {
        lds,
        durableStore,
        network,
        store,
        env,
    };
}

// populates the durable store with a getLayout response
async function populateDurableStore() {
    const { durableStore, lds, network } = buildLds(new MockDurableStore());
    const adapter = getPicklistValues(lds);
    const result = await (adapter(config) as Promise<any>);
    expect(result.state).toBe('Fulfilled');
    const callCount = getMockNetworkAdapterCallCount(network);
    expect(callCount).toBe(1);
    return durableStore;
}

describe('getPicklistValues adapter offline', () => {
    it('returns stale snapshot when data is expired', async () => {
        const { lds } = buildLds(new MockDurableStore());
        const adapter = getPicklistValues(lds);
        const result = await (adapter(config) as Promise<any>);
        expect(result.state).toBe('Fulfilled');
        timekeeper.travel(Date.now() + TTL + 1);
        const staleResult = await (adapter(config) as Promise<any>);
        expect(staleResult.state).toBe('Stale');
    });

    it('does not hit the network when durable store is populated', async () => {
        const durableStore = await populateDurableStore();
        const { lds, network } = buildLds(durableStore);
        const adapter = getPicklistValues(lds);
        const result = await (adapter(config) as Promise<any>);
        expect(result.state).toBe('Fulfilled');
        const callCount = getMockNetworkAdapterCallCount(network);
        expect(callCount).toBe(0);
    });
});
