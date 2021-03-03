// so eslint doesn't complain about nimbus
/* global __nimbus */

import {
    DurableStore,
    DurableStoreChange,
    DurableStoreEntries,
    DurableStoreEntry,
    DurableStoreOperation as LuvioOperation,
    DurableStoreOperationType as LuvioOperationType,
    OnDurableStoreChangedListener,
} from '@luvio/environments';
import {
    DurableStoreChange as NimbusDurableStoreChange,
    DurableStoreOperation as NimbusOperation,
    DurableStoreOperationType as NimbusOperationType,
} from '@mobileplatform/nimbus-plugin-lds';

import { ObjectKeys, ObjectCreate, JSONStringify, JSONParse } from './utils/language';

function operationTypeFromNimbus(type: NimbusOperationType): LuvioOperationType {
    switch (type) {
        case 'evictEntries':
            return LuvioOperationType.EvictEntries;
        case 'setEntries':
            return LuvioOperationType.SetEntries;
    }
}

function operationTypeFromLuvio(type: LuvioOperationType): NimbusOperationType {
    switch (type) {
        case LuvioOperationType.EvictEntries:
            return 'evictEntries';
        case LuvioOperationType.SetEntries:
            return 'setEntries';
    }
}

function unsubscribe(uuidFn: () => string | undefined): () => Promise<void> {
    return () => {
        let uuid = uuidFn();
        if (
            uuid !== undefined &&
            uuid.length > 0 &&
            __nimbus.plugins.LdsDurableStore.unsubscribeOnChangedListener !== undefined
        ) {
            __nimbus.plugins.LdsDurableStore.unsubscribeOnChangedListener(uuid);
        }

        return Promise.resolve();
    };
}

function toNativeEntries(entries: DurableStoreEntries) {
    const putEntries = ObjectCreate(null);
    const keys = ObjectKeys(entries);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const value = entries[key];
        // values are stored on native side as JSON strings
        putEntries[key] = JSONStringify(value);
    }

    return putEntries;
}

export class NimbusDurableStore implements DurableStore {
    batchOperations(operations: LuvioOperation[]): Promise<void> {
        const nimbusOperations: NimbusOperation[] = [];

        for (let i = 0, len = operations.length; i < len; i++) {
            const operation = operations[i];
            let ids = undefined;
            let putEntries = undefined;

            switch (operation.type) {
                case LuvioOperationType.EvictEntries:
                    ids = operation.ids;
                    break;
                case LuvioOperationType.SetEntries: {
                    putEntries = toNativeEntries(operation.entries);
                    break;
                }
            }

            nimbusOperations.push({
                segment: operation.segment,
                type: operationTypeFromLuvio(operation.type),
                entries: putEntries,
                ids: ids,
            });
        }

        return __nimbus.plugins.LdsDurableStore.batchOperations(nimbusOperations, this.senderId);
    }

    senderId: string = this.generateSenderId();

    private generateSenderId(): string {
        const random = Math.floor(Math.random() * 1000000000);
        return random.toString();
    }

    getEntries(entryIds: string[], segment: string): Promise<DurableStoreEntries | undefined> {
        if (entryIds.length === 0) {
            return Promise.resolve({});
        }

        return __nimbus.plugins.LdsDurableStore.getEntriesInSegment(entryIds, segment).then(
            result => {
                const { isMissingEntries, entries } = result;

                if (isMissingEntries) {
                    return undefined;
                }

                const returnEntries: DurableStoreEntries = ObjectCreate(null);
                const keys = ObjectKeys(entries);
                for (let i = 0, len = keys.length; i < len; i++) {
                    const key = keys[i];
                    // values are stored on native side as JSON strings
                    returnEntries[key] = JSONParse(entries[key]) as DurableStoreEntry;
                }
                return returnEntries;
            }
        );
    }

    getAllEntries(segment: string): Promise<DurableStoreEntries | undefined> {
        return __nimbus.plugins.LdsDurableStore.getAllEntriesInSegment(segment).then(result => {
            const { isMissingEntries, entries } = result;

            // if the segment isn't found then isMissingEntries will be set and
            // we should return undefined.
            if (isMissingEntries) {
                return undefined;
            }

            const returnEntries: DurableStoreEntries = ObjectCreate(null);
            const keys = ObjectKeys(entries);
            for (let i = 0, len = keys.length; i < len; i++) {
                const key = keys[i];
                // values are stored on native side as JSON strings
                returnEntries[key] = JSONParse(entries[key]) as DurableStoreEntry;
            }
            return returnEntries;
        });
    }

    setEntries(entries: DurableStoreEntries, segment: string): Promise<void> {
        //W-8963041: Remove this once old versions of setEntries are no longer supported
        if (__nimbus.plugins.LdsDurableStore.batchOperations === undefined) {
            return this.setEntriesOld(entries, segment);
        }

        return this.batchOperations([
            { entries: entries, segment, type: LuvioOperationType.SetEntries },
        ]);
    }

    setEntriesOld(entries: DurableStoreEntries, segment: string): Promise<void> {
        const putEntries = toNativeEntries(entries);

        if (__nimbus.plugins.LdsDurableStore.setEntriesInSegmentWithSender !== undefined) {
            return __nimbus.plugins.LdsDurableStore.setEntriesInSegmentWithSender(
                putEntries,
                segment,
                this.senderId
            );
        }
        return __nimbus.plugins.LdsDurableStore.setEntriesInSegment(putEntries, segment);
    }

    evictEntries(entryIds: string[], segment: string): Promise<void> {
        //W-8963041: Remove this once old versions of setEntries are no longer supported
        if (__nimbus.plugins.LdsDurableStore.batchOperations === undefined) {
            return this.evictEntriesOld(entryIds, segment);
        }

        return this.batchOperations([
            { ids: entryIds, segment, type: LuvioOperationType.EvictEntries },
        ]);
    }

    evictEntriesOld(entryIds: string[], segment: string): Promise<void> {
        if (__nimbus.plugins.LdsDurableStore.evictEntriesInSegmentWithSender !== undefined) {
            return __nimbus.plugins.LdsDurableStore.evictEntriesInSegmentWithSender(
                entryIds,
                segment,
                this.senderId
            );
        }
        return __nimbus.plugins.LdsDurableStore.evictEntriesInSegment(entryIds, segment);
    }

    registerOnChangedListener(listener: OnDurableStoreChangedListener): () => Promise<void> {
        const sender = this.senderId;
        let durableStore = __nimbus.plugins.LdsDurableStore;
        let uuid: string | undefined = undefined;

        if (durableStore.registerOnChangedListenerWithBatchInfo !== undefined) {
            durableStore
                .registerOnChangedListenerWithBatchInfo(events =>
                    listener(mapDurableStoreEvents(events, sender))
                )
                .then(id => {
                    uuid = id;
                });
        }

        return unsubscribe(() => uuid);
    }
}

function mapDurableStoreEvents(
    nimbusChanges: NimbusDurableStoreChange[],
    sender: string
): DurableStoreChange[] {
    const changes: DurableStoreChange[] = [];
    for (let i = 0, len = nimbusChanges.length; i < len; i++) {
        const change = nimbusChanges[i];
        changes.push({
            ...change,
            type: operationTypeFromNimbus(change.type),
            isExternalChange: change.sender !== sender,
        });
    }

    return changes;
}
