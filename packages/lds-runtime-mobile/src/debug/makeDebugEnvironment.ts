import {
    Environment,
    ResourceRequest,
    Snapshot,
    SnapshotRebuild,
    SnapshotSubscriptionCallback,
    Store,
} from '@luvio/engine';
import { ObjectCreate, ObjectKeys } from '../utils/language';
import { debugLog } from './DebugLog';

/**
 * Enables verbose and structure debugging logs. This environment should NOT be used in a production setting
 * @param env Base Environment
 */
export function makeDebugEnvironment(env: Environment) {
    let networkCount = 0;

    // counts the number of dispatch calls
    const dispatchResourceRequest: typeof env['dispatchResourceRequest'] = (
        request: ResourceRequest
    ) => {
        debugLog({ type: 'counter', id: 'network', count: networkCount++ });
        return env.dispatchResourceRequest(request);
    };

    // logs the store size before each broadcast
    const storeBroadcast: typeof env['storeBroadcast'] = (
        rebuildSnapshot: SnapshotRebuild<unknown, unknown>,
        snapshotAvailable: (snapshot: Snapshot<unknown, unknown>) => boolean
    ) => {
        const store = (env as any).store as Store;
        const storeSize = ObjectKeys(store.records).length;
        debugLog({ type: 'counter', id: 'storeSize', count: storeSize });
        return env.storeBroadcast(rebuildSnapshot, snapshotAvailable);
    };

    // logs number of subscriptions on each new subscribe and unsubscribe
    const storeSubscribe = (
        snapshot: Snapshot<unknown, unknown>,
        callback: SnapshotSubscriptionCallback<unknown, unknown>
    ) => {
        const store = (env as any).store as Store;
        const printSubscription = () => {
            const subscriptionLength = store.snapshotSubscriptions.length;
            debugLog({ type: 'counter', id: 'subscriptions', count: subscriptionLength });
        };

        printSubscription();

        const unsubscribe = env.storeSubscribe(snapshot, callback);

        return () => {
            unsubscribe();
            printSubscription();
        };
    };

    return ObjectCreate(env, {
        dispatchResourceRequest: { value: dispatchResourceRequest },
        storeBroadcast: { value: storeBroadcast },
        storeSubscribe: { value: storeSubscribe },
    });
}
