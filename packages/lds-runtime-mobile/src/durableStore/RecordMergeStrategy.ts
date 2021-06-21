import { DurableStoreEntries, DurableStoreEntry } from '@luvio/environments';
import {
    DraftAction,
    DraftActionMap,
    DraftQueue,
    isEntryDurableRecordRepresentation,
} from '@salesforce/lds-drafts';
import { durableMerge, DurableRecordRepresentation } from '@salesforce/lds-drafts';
import { ObjectAssign, ObjectKeys } from '../utils/language';
import { GetRecordConfig, RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { Adapter, ResourceRequest } from '@luvio/engine';
import { MergeStrategy } from './makeDurableStoreWithMergeStrategy';
import { isStoreKeyRecordId } from '@salesforce/lds-uiapi-record-utils';

export class RecordMergeStrategy implements MergeStrategy {
    private readonly draftQueue: DraftQueue;
    private readonly getRecord: Adapter<GetRecordConfig, RecordRepresentation>;
    private readonly userId: string;

    constructor(
        draftQueue: DraftQueue,
        getRecord: Adapter<GetRecordConfig, RecordRepresentation>,
        userId: string
    ) {
        this.draftQueue = draftQueue;
        this.getRecord = getRecord;
        this.userId = userId;
    }

    // only merge sets containing at least one record key
    shouldMerge(incomingKeys: string[]) {
        for (let i = 0, len = incomingKeys.length; i < len; i++) {
            if (isStoreKeyRecordId(incomingKeys[i])) {
                return true;
            }
        }

        return false;
    }

    mergeDurableEntries(
        incomingKeys: string[],
        existingEntries: DurableStoreEntries<unknown>,
        incomingEntries: DurableStoreEntries<unknown>
    ): Promise<DurableStoreEntries<unknown>> {
        const merged = ObjectAssign({}, incomingEntries) as DurableStoreEntries<unknown>;

        const recordKeys: Record<string, true> = {};
        const existingRecords: Record<string, DurableStoreEntry<DurableRecordRepresentation>> = {};
        const incomingRecords: Record<string, DurableStoreEntry<DurableRecordRepresentation>> = {};

        // track any incoming or existing records that contain drafts
        const draftKeys: Record<string, true> = {};
        for (let i = 0, len = incomingKeys.length; i < len; i++) {
            const key = incomingKeys[i];
            const incomingEntry = incomingEntries[key];
            const existingEntry = existingEntries[key];
            if (
                incomingEntry !== undefined &&
                existingEntry !== undefined &&
                isEntryDurableRecordRepresentation(incomingEntry, key) &&
                isEntryDurableRecordRepresentation(existingEntry, key)
            ) {
                recordKeys[key] = true;
                incomingRecords[key] = incomingEntry;
                existingRecords[key] = existingEntry;
                if (
                    incomingEntry.data.drafts !== undefined ||
                    existingEntry.data.drafts !== undefined
                ) {
                    draftKeys[key] = true;
                }
            }
        }

        const keysArray = ObjectKeys(recordKeys);

        if (keysArray.length === 0) {
            return Promise.resolve(merged);
        }

        // optimization - we only request drafts for records if any of the
        // existing or incoming records already contain drafts on them
        let draftPromise: Promise<DraftActionMap>;
        if (ObjectKeys(draftKeys).length === 0) {
            draftPromise = Promise.resolve({});
        } else {
            draftPromise = this.draftQueue.getActionsForTags(draftKeys);
        }

        return draftPromise.then((actionMap) => {
            const { userId, getRecord } = this;
            for (let i = 0, len = keysArray.length; i < len; i++) {
                const key = keysArray[i];
                const drafts =
                    (actionMap[key] as DraftAction<RecordRepresentation, ResourceRequest>[]) ?? [];
                const existing = existingRecords[key];
                const incoming = incomingRecords[key];
                const mergedRecord = durableMerge(existing, incoming, drafts, userId, getRecord);

                merged[key] = mergedRecord;
            }
            return merged;
        });
    }
}