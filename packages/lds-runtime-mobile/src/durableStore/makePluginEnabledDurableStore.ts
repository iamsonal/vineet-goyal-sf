import { DurableStore, DurableStoreEntries } from '@luvio/environments';
import { DurableStoreSetEntryPlugin } from './plugins/DurableStorePlugins';
import { ObjectCreate, ObjectKeys } from '../utils/language';

interface PluginEnabledDurableStore extends DurableStore {
    registerPlugins(plugin: DurableStoreSetEntryPlugin[]): void;
}

export function makePluginEnabledDurableStore(
    durableStore: DurableStore
): PluginEnabledDurableStore {
    const registeredPlugins: DurableStoreSetEntryPlugin[] = [];

    const setEntries: typeof durableStore['setEntries'] = function<T>(
        entries: DurableStoreEntries<T>,
        segment: string
    ): Promise<void> {
        const keys = ObjectKeys(entries);

        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            const value = entries[key];
            for (let j = 0, len = registeredPlugins.length; j < len; j++) {
                const plugin = registeredPlugins[j];
                plugin.beforeSet(key, value, segment);
            }
        }

        return durableStore.setEntries(entries, segment);
    };

    const registerPlugins = function(plugins: DurableStoreSetEntryPlugin[]) {
        for (let i = 0, len = plugins.length; i < len; i++) {
            registeredPlugins.push(plugins[i]);
        }
    };

    return ObjectCreate(durableStore, {
        setEntries: { value: setEntries },
        registerPlugins: { value: registerPlugins },
    });
}
