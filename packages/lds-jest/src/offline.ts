import timekeeper from 'timekeeper';
import { Luvio, Store, Environment, NetworkAdapter, AdapterFactory } from '@luvio/engine';
import {
    makeDurable,
    makeOffline,
    ResponsePropertyRetriever,
    DurableEnvironment,
} from '@luvio/environments';
import {
    buildMockNetworkAdapter,
    MockDurableStore,
    getMockNetworkAdapterCallCount,
    MockPayload,
} from '@luvio/adapter-test-library';

export type CustomEnvironmentFactory = (
    environment: Environment,
    durableStore: MockDurableStore,
    store: Store
) => DurableEnvironment;

export function buildOfflineLuvio(
    durableStore: MockDurableStore,
    network: NetworkAdapter,
    customEnvironment?: CustomEnvironmentFactory,
    reviveRetrievers?: ResponsePropertyRetriever<any, any>[]
) {
    const store = new Store();
    let env: Environment = makeDurable(makeOffline(new Environment(store, network)), {
        durableStore,
        reviveRetrievers: reviveRetrievers || [],
    });
    if (customEnvironment !== undefined) {
        env = customEnvironment(env, durableStore, store);
    }
    const luvio = new Luvio(env);
    return {
        luvio,
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
    const { durableStore, luvio, network } = buildOfflineLuvio(
        new MockDurableStore(),
        buildMockNetworkAdapter([payload])
    );
    const adapter = adapterFactory(luvio);
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
    const { luvio } = buildOfflineLuvio(
        new MockDurableStore(),
        buildMockNetworkAdapter([payload]),
        customEnvironment,
        reviveRetrievers
    );
    const adapter = adapterFactory(luvio);
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
    const { luvio, network } = buildOfflineLuvio(
        durableStore,
        buildMockNetworkAdapter([payload]),
        customEnvironment,
        reviveRetrievers
    );
    const adapter = adapterFactory(luvio);
    const result = await (adapter(config) as Promise<any>);
    expect(result.state).toBe('Fulfilled');
    const callCount = getMockNetworkAdapterCallCount(network);
    expect(callCount).toBe(0);
}
