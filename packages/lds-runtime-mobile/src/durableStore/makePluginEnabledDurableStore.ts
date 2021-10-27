import {
    DurableStore,
    DurableStoreEntries,
    DurableStoreOperation,
    DurableStoreOperationType,
} from '@luvio/environments';
import { DurableStoreSetEntryPlugin } from './plugins/DurableStorePlugins';
import { ObjectCreate, ObjectKeys } from '../utils/language';

interface PluginEnabledDurableStore extends DurableStore {
    registerPlugins(plugin: DurableStoreSetEntryPlugin[]): void;
}

export function makePluginEnabledDurableStore(
    durableStore: DurableStore
): PluginEnabledDurableStore {
    const registeredPlugins: DurableStoreSetEntryPlugin[] = [];

    const setEntries: typeof durableStore['setEntries'] = function <T>(
        entries: DurableStoreEntries<T>,
        segment: string
    ): Promise<void> {
        const keys = ObjectKeys(entries);

        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            const value = entries[key];
            for (let j = 0, len = registeredPlugins.length; j < len; j++) {
                const plugin = registeredPlugins[j];
                plugin.beforeSet(key, value, segment, durableStore);
            }
        }

        return durableStore.setEntries(entries, segment);
    };

    const batchOperations: typeof durableStore['batchOperations'] = function <T>(
        operations: DurableStoreOperation<T>[]
    ): Promise<void> {
        for (let i = 0, len = operations.length; i < len; i++) {
            const operation = operations[i];

            // TODO [W-10093955]: add a beforeEvict plugin and include those
            if (operation.type === DurableStoreOperationType.SetEntries) {
                const { entries, segment } = operation;

                const keys = ObjectKeys(entries);

                for (let j = 0, len = keys.length; j < len; j++) {
                    const key = keys[j];
                    const value = entries[key];
                    for (let k = 0, len = registeredPlugins.length; k < len; k++) {
                        const plugin = registeredPlugins[k];
                        plugin.beforeSet(key, value, segment, durableStore);
                    }
                }
            }
        }

        return durableStore.batchOperations(operations);
    };

    const registerPlugins = function (plugins: DurableStoreSetEntryPlugin[]) {
        for (let i = 0, len = plugins.length; i < len; i++) {
            registeredPlugins.push(plugins[i]);
        }
    };

    return ObjectCreate(durableStore, {
        setEntries: { value: setEntries },
        batchOperations: { value: batchOperations },
        registerPlugins: { value: registerPlugins },
    });
}
