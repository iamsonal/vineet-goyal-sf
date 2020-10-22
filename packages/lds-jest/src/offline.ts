import timekeeper from 'timekeeper';
import { LDS, Store, Environment, NetworkAdapter, AdapterFactory } from '@ldsjs/engine';
import {
    makeDurable,
    makeOffline,
    ResponsePropertyRetriever,
    DurableEnvironment,
} from '@ldsjs/environments';
import {
    buildMockNetworkAdapter,
    MockDurableStore,
    getMockNetworkAdapterCallCount,
    MockPayload,
} from '@ldsjs/adapter-test-library';

export type CustomEnvironmentFactory = (
    environment: Environment,
    durableStore: MockDurableStore,
    store: Store
) => DurableEnvironment;

export function buildOfflineLds(
    durableStore: MockDurableStore,
    network: NetworkAdapter,
    customEnvironment?: CustomEnvironmentFactory,
    reviveRetrievers?: ResponsePropertyRetriever<any, any>[]
) {
    const store = new Store();
    let env: Environment = makeDurable(
        makeOffline(new Environment(store, network)),
        durableStore,
        reviveRetrievers ?? []
    );
    if (customEnvironment !== undefined) {
        env = customEnvironment(env, durableStore, store);
    }
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
export async function populateDurableStore<Config, DataType>(
    adapterFactory: AdapterFactory<Config, DataType>,
    config: Config,
    payload: MockPayload
) {
    const { durableStore, lds, network } = buildOfflineLds(
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
    ttl: number,
    customEnvironment?: CustomEnvironmentFactory,
    reviveRetrievers?: ResponsePropertyRetriever<any, any>[]
) {
    const { lds } = buildOfflineLds(
        new MockDurableStore(),
        buildMockNetworkAdapter([payload]),
        customEnvironment,
        reviveRetrievers
    );
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
    payload: MockPayload,
    customEnvironment?: CustomEnvironmentFactory,
    reviveRetrievers?: ResponsePropertyRetriever<any, any>[]
) {
    const durableStore = await populateDurableStore(adapterFactory, config, payload);
    const { lds, network } = buildOfflineLds(
        durableStore,
        buildMockNetworkAdapter([payload]),
        customEnvironment,
        reviveRetrievers
    );
    const adapter = adapterFactory(lds);
    const result = await (adapter(config) as Promise<any>);
    expect(result.state).toBe('Fulfilled');
    const callCount = getMockNetworkAdapterCallCount(network);
    expect(callCount).toBe(0);
}
