import timekeeper from 'timekeeper';
import {
    Luvio,
    Store,
    Environment,
    NetworkAdapter,
    AdapterFactory,
    PendingSnapshot,
    Snapshot,
} from '@luvio/engine';
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

export interface OfflineOptions {
    customEnvironment?: CustomEnvironmentFactory;
    reviveRetrievers?: ResponsePropertyRetriever<any, any>[];
    compositeRetrievers?: ResponsePropertyRetriever<any, any>[];
}

function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

export function buildOfflineLuvio(
    durableStore: MockDurableStore,
    network: NetworkAdapter,
    options: OfflineOptions = {}
) {
    const { compositeRetrievers, customEnvironment, reviveRetrievers } = options;
    // TODO: use default scheduler
    const store = new Store({ scheduler: () => {} });
    let env = makeDurable(makeOffline(new Environment(store, network)), {
        durableStore,
        reviveRetrievers: reviveRetrievers || [],
        compositeRetrievers: compositeRetrievers || [],
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

    // TODO - W-9051409 we don't need to check for Promises once custom adapters
    // are updated to not use resolveUnfulfilledSnapshot
    const snapshotOrPromise = adapter(config)!;
    let result: Snapshot<any>;
    if ('then' in snapshotOrPromise) {
        result = await snapshotOrPromise;
    } else {
        result = await luvio.resolvePendingSnapshot(snapshotOrPromise as PendingSnapshot<any, any>);
    }
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

    // TODO - W-9051409 we don't need to check for Promises once custom adapters
    // are updated to not use resolveUnfulfilledSnapshot
    const snapshotOrPromise = adapter(config)!;
    let result: Snapshot<any>;
    if ('then' in snapshotOrPromise) {
        result = await snapshotOrPromise;
    } else {
        result = await luvio.resolvePendingSnapshot(snapshotOrPromise as PendingSnapshot<any, any>);
    }
    expect(result.state).toBe('Fulfilled');

    timekeeper.travel(Date.now() + ttl + 1);

    // TODO - W-9051409 we don't need to check for Promises once custom adapters
    // are updated to not use resolveUnfulfilledSnapshot
    const staleSnapshotOrPromise = adapter(config)!;
    let staleResult: Snapshot<any>;
    if ('then' in staleSnapshotOrPromise) {
        staleResult = await staleSnapshotOrPromise;
    } else if (staleSnapshotOrPromise.state === 'Pending') {
        staleResult = await luvio.resolvePendingSnapshot(
            staleSnapshotOrPromise as PendingSnapshot<any, any>
        );
    } else {
        staleResult = staleSnapshotOrPromise;
    }
    expect(staleResult.state).toBe('Stale');

    // makeOffline will kick off a refresh, wait for that to ensure it doesn't
    // throw any errors
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

    // TODO - W-9051409 we don't need to check for Promises once custom adapters
    // are updated to not use resolveUnfulfilledSnapshot
    const snapshotOrPromise = adapter(config)!;
    let result: Snapshot<DataType>;
    if ('then' in snapshotOrPromise) {
        result = await snapshotOrPromise;
    } else {
        result = await luvio.resolvePendingSnapshot(snapshotOrPromise as PendingSnapshot<any, any>);
    }
    expect(result.state).toBe('Fulfilled');

    const callCount = getMockNetworkAdapterCallCount(network);
    expect(callCount).toBe(0);

    // ensure no outstanding promises throw errors
    await flushPromises();

    return result;
}
