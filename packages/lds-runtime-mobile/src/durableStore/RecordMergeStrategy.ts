import { DurableStore, DurableStoreEntries, DurableStoreEntry } from '@luvio/environments';
import {
    durableMerge,
    DurableRecordEntry,
    getDraftResolutionInfoForRecordSet,
    DraftActionMap,
    isEntryDurableRecordRepresentation,
    DraftResolutionInput,
    DraftAction,
} from '@salesforce/lds-drafts';
import { ArrayIsArray, ObjectAssign, ObjectKeys } from '../utils/language';
import {
    GetRecordConfig,
    ObjectInfoRepresentation,
    RecordRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { namespace as graphQLNamespace } from '@salesforce/lds-adapters-graphql';
import { Adapter, ResourceRequest } from '@luvio/engine';
import { MergeStrategy } from './makeDurableStoreWithMergeStrategy';
import { isStoreKeyRecordId } from '@salesforce/lds-uiapi-record-utils';

type GetDraftActionsForRecords = (keys: string[]) => Promise<DraftActionMap>;

function isGqlCacheKey(key: string) {
    return key.startsWith(`${graphQLNamespace}::`);
}

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

    // only merge sets containing at least one record key or GQL key
    shouldMerge(incomingKeys: string[]) {
        for (let i = 0, len = incomingKeys.length; i < len; i++) {
            const key = incomingKeys[i];
            if (isStoreKeyRecordId(key)) {
                return true;
            }

            // both RecordReps and the GQL root keys need to be merged
            if (isGqlCacheKey(key)) {
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

            if (incomingEntry === undefined || existingEntry === undefined) {
                continue;
            }

            if (
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
            } else if (isGqlCacheKey(key)) {
                // GQL root keys are spread merged
                const { data: existingData, metadata: existingMetadata } = existingEntry;
                const { data: incomingData, metadata: incomingMetadata } = incomingEntry;

                let data;
                if (ArrayIsArray(existingData) && ArrayIsArray(incomingData)) {
                    // TODO [W-9921803]: for now if we get to a GQL edges array we just
                    // trust the incoming and don't worry about merging.  This entire
                    // durable merge file is going away so this temporary workaround
                    // is palatable
                    data = incomingData;
                } else {
                    data = ObjectAssign({}, existingData, incomingData);
                }

                let metadata: DurableStoreEntry['metadata'] | undefined;
                if (existingMetadata !== undefined || incomingMetadata !== undefined) {
                    metadata = ObjectAssign({}, existingMetadata, incomingMetadata);
                }
                merged[key] = { data, metadata };
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
