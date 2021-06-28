import { DurableStore, DurableStoreEntries } from '@luvio/environments';
import {
    durableMerge,
    DurableRecordEntry,
    getDraftResolutionInfoForRecordSet,
    DraftActionMap,
    isEntryDurableRecordRepresentation,
    DraftResolutionInput,
    DraftAction,
} from '@salesforce/lds-drafts';
import { ObjectAssign, ObjectKeys } from '../utils/language';
import {
    GetRecordConfig,
    ObjectInfoRepresentation,
    RecordRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { Adapter, ResourceRequest } from '@luvio/engine';
import { MergeStrategy } from './makeDurableStoreWithMergeStrategy';
import { isStoreKeyRecordId } from '@salesforce/lds-uiapi-record-utils';

type GetDraftActionsForRecords = (keys: string[]) => Promise<DraftActionMap>;

export class RecordMergeStrategy implements MergeStrategy {
    private readonly getDraftActions: GetDraftActionsForRecords;
    private readonly durableStore: DurableStore;
    private readonly getRecord: Adapter<GetRecordConfig, RecordRepresentation>;
    private readonly userId: string;

    constructor(
        durableStore: DurableStore,
        getDraftActions: GetDraftActionsForRecords,
        getRecord: Adapter<GetRecordConfig, RecordRepresentation>,
        userId: string
    ) {
        this.durableStore = durableStore;
        this.getDraftActions = getDraftActions;
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
        const existingRecords: DurableStoreEntries<DurableRecordEntry> = {};
        const incomingRecords: DurableStoreEntries<DurableRecordEntry> = {};

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
        let draftPromise: Promise<Record<string, DraftResolutionInput>>;
        if (ObjectKeys(draftKeys).length === 0) {
            draftPromise = Promise.resolve({});
        } else {
            draftPromise = getDraftResolutionInfoForRecordSet(
                incomingRecords,
                this.durableStore,
                this.getDraftActions
            );
        }

        // get object infos and drafts so we can replay the drafts on the merged result
        return draftPromise.then((draftResolutionInfo) => {
            const { userId, getRecord } = this;
            for (let i = 0, len = keysArray.length; i < len; i++) {
                const key = keysArray[i];
                const existing = existingRecords[key];
                const incoming = incomingRecords[key];

                const draftInfo = draftResolutionInfo[key];
                let drafts: DraftAction<RecordRepresentation, ResourceRequest>[] = [];
                let objectInfo: ObjectInfoRepresentation | undefined;
                if (draftInfo !== undefined) {
                    drafts = draftInfo.drafts;
                    objectInfo = draftInfo.objectInfo;
                }

                const mergedRecord = durableMerge(
                    existing,
                    incoming,
                    drafts,
                    objectInfo,
                    userId,
                    getRecord
                );

                merged[key] = mergedRecord;
            }
            return merged;
        });
    }
}
