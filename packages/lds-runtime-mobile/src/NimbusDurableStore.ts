import { DurableStore, DurableStoreEntries } from '@ldsjs/environments';

// TODO W-7730068 the lds store nimbus plugin will export and publish it's TS interface
// and then this global declaration can go away
/* eslint-disable no-implicit-globals */
declare global {
    namespace __nimbus {
        namespace plugins {
            namespace LdsStorePlugin {
                function getEntries(recordIds: string[]): Promise<DurableStoreEntries>;

                function setEntries(recordSource: DurableStoreEntries): Promise<void>;

                function evictEntries(recordIds: string[]): Promise<void>;
            }
        }
    }
}

export class NimbusDurableStore implements DurableStore {
    getEntries(entryIds: string[]): Promise<DurableStoreEntries | undefined> {
        return __nimbus.plugins.LdsStorePlugin.getEntries(entryIds).then(
            (result: DurableStoreEntries) => {
                if (result !== null) {
                    const resultKeys = Object.keys(result);
                    // TODO W-7730068 the durable store interface will get updated
                    // to include some mechanism to hint if all the records were
                    // found so we don't have to do this expensive operation
                    // here
                    const allThere = entryIds.every(id => resultKeys.includes(id));
                    if (allThere) {
                        return result;
                    }
                }

                return undefined;
            }
        );
    }

    setEntries(entries: DurableStoreEntries): Promise<void> {
        // TODO W-7644069 need to pluck out pending fields from records
        return __nimbus.plugins.LdsStorePlugin.setEntries(entries);
    }

    evictEntries(entryIds: string[]): Promise<void> {
        return __nimbus.plugins.LdsStorePlugin.evictEntries(entryIds);
    }
}
