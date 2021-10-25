// so eslint doesn't complain about nimbus
/* global __nimbus */

import {
    DefaultDurableSegment,
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
    DurableStoreFetchResult,
} from '@mobileplatform/nimbus-plugin-lds';

import { ObjectKeys, ObjectCreate, JSONStringify, JSONParse } from './utils/language';

import { idleDetector } from 'o11y/client';

const tasker = idleDetector.declareNotifierTaskMulti('NimbusDurableStore');

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

function toNativeEntries(entries: DurableStoreEntries<unknown>): { [key: string]: string } {
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
    batchOperations(operations: LuvioOperation<unknown>[]): Promise<void> {
        const nimbusOperations: NimbusOperation[] = [];

        for (let i = 0, len = operations.length; i < len; i++) {
            const operation = operations[i];
            let ids: string[];
            let putEntries: { [key: string]: string } | undefined = undefined;

            switch (operation.type) {
                case LuvioOperationType.EvictEntries:
                    ids = operation.ids;
                    break;
                case LuvioOperationType.SetEntries: {
                    putEntries = toNativeEntries(operation.entries);
                    ids = ObjectKeys(putEntries);
                    break;
                }
            }

            nimbusOperations.push({
                segment: operation.segment,
                type: operationTypeFromLuvio(operation.type),
                entries: putEntries,
                ids,
            });
        }

        tasker.add();
        return __nimbus.plugins.LdsDurableStore.batchOperations(
            nimbusOperations,
            this.senderId
        ).finally(() => tasker.done());
    }

    senderId: string = this.generateSenderId();

    private generateSenderId(): string {
        const random = Math.floor(Math.random() * 1000000000);
        return random.toString();
    }

    private convertToEntryList<T>(result: DurableStoreFetchResult): DurableStoreEntries<T> {
        const { entries } = result;
        const returnEntries: DurableStoreEntries<T> = ObjectCreate(null);
        const keys = ObjectKeys(entries);
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            // values are stored on native side as JSON strings
            returnEntries[key] = JSONParse(entries[key]) as DurableStoreEntry<T>;
        }
        return returnEntries;
    }

    getEntries<T>(
        entryIds: string[],
        segment: string
    ): Promise<DurableStoreEntries<T> | undefined> {
        if (entryIds.length === 0) {
            return Promise.resolve({});
        }

        tasker.add();

        // TODO [W-9930552]: Remove this once getEntriesInSegment is no longer supported
        return __nimbus.plugins.LdsDurableStore.getEntriesInSegment(entryIds, segment)
            .then((result) => {
                return this.convertToEntryList(result) as DurableStoreEntries<T>;
            })
            .finally(() => tasker.done());
    }

    getAllEntries<T>(segment: string): Promise<DurableStoreEntries<T> | undefined> {
        tasker.add();

        // TODO [W-9930552]: Remove this getAllEntriesInSegment is no longer supported
        return __nimbus.plugins.LdsDurableStore.getAllEntriesInSegment(segment)
            .then((result) => {
                // if the segment isn't found then isMissingEntries will be set and
                // we should return undefined.
                if (result.isMissingEntries) {
                    return undefined;
                }
                return this.convertToEntryList(result) as DurableStoreEntries<T>;
            })
            .finally(() => tasker.done());
    }

    setEntries<T>(entries: DurableStoreEntries<T>, segment: string): Promise<void> {
        // TODO [W-8963041]: Remove this once old versions of setEntries are no longer supported
        if (__nimbus.plugins.LdsDurableStore.batchOperations === undefined) {
            return this.setEntriesOld(entries, segment);
        }

        return this.batchOperations([
            { entries: entries, segment, type: LuvioOperationType.SetEntries },
        ]);
    }

    private setEntriesOld(entries: DurableStoreEntries<unknown>, segment: string): Promise<void> {
        const putEntries = toNativeEntries(entries);

        tasker.add();
        if (__nimbus.plugins.LdsDurableStore.setEntriesInSegmentWithSender !== undefined) {
            return __nimbus.plugins.LdsDurableStore.setEntriesInSegmentWithSender(
                putEntries,
                segment,
                this.senderId
            ).finally(() => tasker.done());
        }
        return __nimbus.plugins.LdsDurableStore.setEntriesInSegment(putEntries, segment).finally(
            () => tasker.done()
        );
    }

    evictEntries(entryIds: string[], segment: string): Promise<void> {
        if (__nimbus.plugins.LdsDurableStore.batchOperations !== undefined) {
            return this.batchOperations([
                { ids: entryIds, segment, type: LuvioOperationType.EvictEntries },
            ]);
        }

        // TODO [W-8963041]: Remove this once old versions of setEntries are no longer supported
        return this.evictEntriesOld(entryIds, segment);
    }

    private evictEntriesOld(entryIds: string[], segment: string): Promise<void> {
        tasker.add();
        if (__nimbus.plugins.LdsDurableStore.evictEntriesInSegmentWithSender !== undefined) {
            return __nimbus.plugins.LdsDurableStore.evictEntriesInSegmentWithSender(
                entryIds,
                segment,
                this.senderId
            ).finally(() => tasker.done());
        }
        return __nimbus.plugins.LdsDurableStore.evictEntriesInSegment(entryIds, segment).finally(
            () => tasker.done()
        );
    }

    registerOnChangedListener(listener: OnDurableStoreChangedListener): () => Promise<void> {
        const sender = this.senderId;
        const durableStore = __nimbus.plugins.LdsDurableStore;
        let uuid: string | undefined = undefined;

        if (durableStore.registerOnChangedListenerWithBatchInfo !== undefined) {
            durableStore
                .registerOnChangedListenerWithBatchInfo((events) =>
                    listener(mapDurableStoreEvents(events, sender))
                )
                .then((id) => {
                    uuid = id;
                });
        } else if (durableStore.registerOnChangedListenerWithInfo !== undefined) {
            durableStore.registerOnChangedListenerWithInfo((info) => {
                listener([
                    { ids: info.ids, segment: info.segment, type: LuvioOperationType.SetEntries },
                ]);
            });
        } else if (durableStore.registerOnChangedListener !== undefined) {
            durableStore.registerOnChangedListener((ids) => {
                listener([
                    { ids, segment: DefaultDurableSegment, type: LuvioOperationType.SetEntries },
                ]);
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
