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

import { factory as getLayoutAdapterFactory } from '../index';
import layoutOpportunityFull from './mockData/layout-Opportunity-Full.json';
import { keyBuilder, TTL } from '../../../generated/types/RecordLayoutRepresentation';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/layout/Opportunity`,
};
const recordPayload: MockPayload = buildSuccessMockPayload(requestArgs, layoutOpportunityFull);

const config = {
    objectApiName: 'Opportunity',
    layoutType: 'Full',
    mode: 'View',
    recordTypeId: '012000000000000AAA',
};

const layoutKey = keyBuilder(config);

function buildLds(durableStore: MockDurableStore) {
    const network = buildMockNetworkAdapter([recordPayload]);
    const store = new Store();
    const env = makeOffline(makeDurable(new Environment(store, network), durableStore));
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
    const adapter = getLayoutAdapterFactory(lds);
    const result = await (adapter(config) as Promise<any>);
    expect(result.state).toBe('Fulfilled');
    const callCount = getMockNetworkAdapterCallCount(network);
    expect(callCount).toBe(1);
    return {
        durableStore,
    };
}

describe('getLayout adapter offline', () => {
    it('returns stale snapshot when data is expired', async () => {
        const { lds } = buildLds(new MockDurableStore());
        const adapter = getLayoutAdapterFactory(lds);
        const result = await (adapter(config) as Promise<any>);
        expect(result.state).toBe('Fulfilled');
        timekeeper.travel(Date.now() + TTL + 1);
        const staleResult = await (adapter(config) as Promise<any>);
        expect(staleResult.state).toBe('Stale');
    });

    it('does not hit the network when durable store is populated', async () => {
        const { durableStore } = await populateDurableStore();
        expect(durableStore.entries[layoutKey]).toBeDefined();
        const { lds, network } = buildLds(durableStore);
        const adapter = getLayoutAdapterFactory(lds);
        const result = await (adapter(config) as Promise<any>);
        expect(result.state).toBe('Fulfilled');
        const callCount = getMockNetworkAdapterCallCount(network);
        expect(callCount).toBe(0);
    });
});
