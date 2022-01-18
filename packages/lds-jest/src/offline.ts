import timekeeper from 'timekeeper';
import { Luvio, Store, Environment, NetworkAdapter, AdapterFactory, Snapshot } from '@luvio/engine';
import { makeDurable, DurableEnvironment } from '@luvio/environments';
import {
    buildMockNetworkAdapter,
    MockDurableStore,
    getMockNetworkAdapterCallCount,
    MockPayload,
} from '@luvio/adapter-test-library';
import { flushPromises } from './utils';

export type CustomEnvironmentFactory = (
    environment: Environment,
    durableStore: MockDurableStore,
    store: Store
) => DurableEnvironment;

export interface OfflineOptions {
    customEnvironment?: CustomEnvironmentFactory;
}

export function buildOfflineLuvio(
    durableStore: MockDurableStore,
    network: NetworkAdapter,
    options: OfflineOptions = {}
) {
    const { customEnvironment } = options;
    // eslint-disable-next-line @salesforce/lds/no-invalid-todo
    // TODO: use default scheduler
    const store = new Store({ scheduler: () => {} });
    let env = makeDurable(new Environment(store, network), {
        durableStore,
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
    payload: MockPayload,
    options: { existingDurableStore?: MockDurableStore } = {}
) {
    const { durableStore, luvio, network, env } = buildOfflineLuvio(
        options.existingDurableStore !== undefined
            ? options.existingDurableStore
            : new MockDurableStore(),
        buildMockNetworkAdapter([payload])
    );
    const adapter = adapterFactory(luvio);

    const result = await adapter(config)!;

    expect(result.state).toBe('Fulfilled');

    const callCount = getMockNetworkAdapterCallCount(network);
    expect(callCount).toBe(1);

    // dispose the makeDurable environment so it doesn't keep listening
    // to DS changes
    env.dispose();

    return durableStore;
}

export async function testDataEmittedWhenStale<Config, DataType>(
    adapterFactory: AdapterFactory<Config, DataType>,
    config: Config,
    payload: MockPayload,
    ttl: number,
    options: OfflineOptions = {}
) {
    const { luvio } = buildOfflineLuvio(
        new MockDurableStore(),
        buildMockNetworkAdapter([payload]),
        options
    );
    const adapter = adapterFactory(luvio);

    const result = await adapter(config)!;

    expect(result.state).toBe('Fulfilled');

    timekeeper.travel(Date.now() + ttl + 1);

    const staleSnapshotOrPromise = adapter(config)!;
    let staleResult: Snapshot<any>;
    if ('then' in staleSnapshotOrPromise) {
        staleResult = await staleSnapshotOrPromise;
    } else {
        staleResult = staleSnapshotOrPromise;
    }
    expect(staleResult.state).toBe('Stale');

    // default makeDurable cache policy (stale-while-revalidate) will kick off a
    // refresh, wait for that to ensure it doesn't throw any errors
    await flushPromises();
}

export async function testDurableHitDoesNotHitNetwork<Config, DataType>(
    adapterFactory: AdapterFactory<Config, DataType>,
    config: Config,
    payload: MockPayload,
    options: OfflineOptions = {}
): Promise<Snapshot<DataType, any>> {
    const durableStore = await populateDurableStore(adapterFactory, config, payload);
    const { luvio, network } = buildOfflineLuvio(
        durableStore,
        buildMockNetworkAdapter([payload]),
        options
    );
    const adapter = adapterFactory(luvio);

    const result = await adapter(config)!;

    expect(result.state).toBe('Fulfilled');

    const callCount = getMockNetworkAdapterCallCount(network);
    expect(callCount).toBe(0);

    // ensure no outstanding promises throw errors
    await flushPromises();

    return result;
}
