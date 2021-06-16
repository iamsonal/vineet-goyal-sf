import { DefaultDurableSegment, DurableStore, DurableStoreEntries } from '@luvio/environments';
import { ObjectCreate, ObjectKeys } from '../utils/language';

export interface MergeStrategy {
    shouldMerge(incomingKeys: string[]): boolean;
    mergeDurableEntries(
        incomingKeys: string[],
        existingEntries: DurableStoreEntries<unknown>,
        incomingEntries: DurableStoreEntries<unknown>
    ): Promise<DurableStoreEntries<unknown>>;
}

interface DurableStoreWithMergeStrategy extends DurableStore {
    registerMergeStrategy(strategy: MergeStrategy): void;
}

/**
 * Creates a durable store that allows a merge strategy to be registered.
 *
 * On setEntries, first a call to getEntries is made to read out any existing data. The existing
 * and incoming data is passed to the MergeStrategy and its result gets stored into the durable store
 *
 * All calls to setEntries get queued so only one merge operation can be ongoing at any given time.
 *
 * NOTE: any calls to getEntries while an ongoing merge is going on will not receive the merge result
 *
 * @param durableStore base durableStore
 * @returns a durable store which accepts a merge strategy
 */
export function makeDurableStoreWithMergeStrategy(
    durableStore: DurableStore
): DurableStoreWithMergeStrategy {
    let mergeStrategy: MergeStrategy;
    const pendingMerges: (() => Promise<void>)[] = [];

    const runNextMerge = function () {
        if (pendingMerges.length > 0) {
            pendingMerges[0]();
        }
    };

    const mergeAndSet = function <T>(
        keys: string[],
        entries: DurableStoreEntries<T>,
        segment: string
    ) {
        const deferred = new Promise<void>((resolve, reject) => {
            pendingMerges.push(() => {
                return durableStore.getEntries(keys, segment).then((existingEntries) => {
                    if (existingEntries === undefined) {
                        return durableStore.setEntries(entries, segment);
                    }
                    return mergeStrategy
                        .mergeDurableEntries(keys, existingEntries, entries)
                        .then((merged) => {
                            return durableStore
                                .setEntries(merged, segment)
                                .then(() => {
                                    resolve();
                                })
                                .catch((e) => {
                                    reject(e);
                                })
                                .finally(() => {
                                    pendingMerges.shift();
                                    runNextMerge();
                                });
                        });
                });
            });
        });

        if (pendingMerges.length === 1) {
            runNextMerge();
        }

        return deferred;
    };

    const setEntries: typeof durableStore['setEntries'] = function <T>(
        entries: DurableStoreEntries<T>,
        segment: string
    ): Promise<void> {
        if (mergeStrategy === undefined) {
            throw Error('merge strategy not configured');
        }

        const keys = ObjectKeys(entries);
        if (
            entries === undefined ||
            keys.length === 0 ||
            segment !== DefaultDurableSegment ||
            mergeStrategy.shouldMerge(keys) === false
        ) {
            return durableStore.setEntries(entries, segment);
        }

        return mergeAndSet(keys, entries, segment);
    };

    const registerMergeStrategy = function (strategy: MergeStrategy) {
        mergeStrategy = strategy;
    };

    return ObjectCreate(durableStore, {
        setEntries: { value: setEntries },
        registerMergeStrategy: { value: registerMergeStrategy },
    });
}
