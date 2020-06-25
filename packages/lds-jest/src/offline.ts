import timekeeper from 'timekeeper';
import { LDS, Store, Environment, NetworkAdapter, AdapterFactory } from '@ldsjs/engine';
import { makeDurable, makeOffline } from '@ldsjs/environments';
import {
    buildMockNetworkAdapter,
    MockDurableStore,
    getMockNetworkAdapterCallCount,
    MockPayload,
} from '@ldsjs/adapter-test-library';

function buildLds(durableStore: MockDurableStore, network: NetworkAdapter) {
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

// populates the durable store with a provided payload
async function populateDurableStore<Config, DataType>(
    adapterFactory: AdapterFactory<Config, DataType>,
    config: Config,
    payload: MockPayload
) {
    const { durableStore, lds, network } = buildLds(
        new MockDurableStore(),
        buildMockNetworkAdapter([payload])
    );
    const adapter = adapterFactory(lds);
    const result = await (adapter(config) as Promise<any>);
    expect(result.state).toBe('Fulfilled');
    const callCount = getMockNetworkAdapterCallCount(network);
    expect(callCount).toBe(1);
    return durableStore;
}

export async function testDataEmittedWhenStale<Config, DataType>(
    adapterFactory: AdapterFactory<Config, DataType>,
    config: Config,
    payload: MockPayload,
    ttl: number
) {
    const { lds } = buildLds(new MockDurableStore(), buildMockNetworkAdapter([payload]));
    const adapter = adapterFactory(lds);
    const result = await (adapter(config) as Promise<any>);
    expect(result.state).toBe('Fulfilled');
    timekeeper.travel(Date.now() + ttl + 1);
    const staleResult = await (adapter(config) as Promise<any>);
    expect(staleResult.state).toBe('Stale');
}

export async function testDurableHitDoesNotHitNetwork<Config, DataType>(
    adapterFactory: AdapterFactory<Config, DataType>,
    config: Config,
    payload: MockPayload
) {
    const durableStore = await populateDurableStore(adapterFactory, config, payload);
    const { lds, network } = buildLds(durableStore, buildMockNetworkAdapter([payload]));
    const adapter = adapterFactory(lds);
    const result = await (adapter(config) as Promise<any>);
    expect(result.state).toBe('Fulfilled');
    const callCount = getMockNetworkAdapterCallCount(network);
    expect(callCount).toBe(0);
}
