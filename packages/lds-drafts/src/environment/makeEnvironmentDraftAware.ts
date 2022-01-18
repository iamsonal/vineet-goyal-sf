import {
    Adapter,
    CacheKeySet,
    Environment,
    ResourceRequest,
    Snapshot,
    SnapshotRebuild,
    Store,
} from '@luvio/engine';
import {
    DefaultDurableSegment,
    DurableEnvironment,
    DurableStoreChange,
    DurableStoreEntry,
    publishDurableStoreEntries,
} from '@luvio/environments';
import {
    DraftAction,
    DraftActionMap,
    DraftIdMappingEntry,
    DraftQueue,
    DraftQueueCompleteEvent,
    DraftQueueEvent,
    DraftQueueEventType,
} from '../DraftQueue';
import {
    FieldValueRepresentationNormalized,
    GetObjectInfoConfig,
    keyBuilderRecord,
    ObjectInfoRepresentation,
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '@salesforce/lds-adapters-uiapi';
import {
    extractRecordIdFromStoreKey,
    isStoreKeyRecordField,
    RECORD_REPRESENTATION_NAME,
} from '@salesforce/lds-uiapi-record-utils';
import { getRecordDraftEnvironment } from './getRecordDraftEnvironment';
import { createRecordDraftEnvironment } from './createRecordDraftEnvironment';
import {
    updateRecordDraftEnvironment,
    UpdateRecordDraftEnvironmentOptions,
} from './updateRecordDraftEnvironment';
import { deleteRecordDraftEnvironment } from './deleteRecordDraftEnvironment';
import { getRecordsDraftEnvironment } from './getRecordsDraftEnvironment';
import { RecordDenormalizingDurableStore } from '../durableStore/makeRecordDenormalizingDurableStore';
import { DRAFT_ID_MAPPINGS_SEGMENT } from '../DurableDraftQueue';
import { ObjectCreate, ObjectKeys } from '../utils/language';
import { isLDSDraftAction, LDS_ACTION_METADATA_API_NAME } from '../actionHandlers/LDSActionHandler';
import { getRecordKeyForId } from '../utils/records';
import { getObjectInfos } from '../utils/objectInfo';
import { applyDrafts } from '../utils/applyDrafts';

type AllDraftEnvironmentOptions = DraftEnvironmentOptions & UpdateRecordDraftEnvironmentOptions;

export interface DraftEnvironmentOptions {
    store: Store;
    draftQueue: DraftQueue;
    durableStore: RecordDenormalizingDurableStore;
    // TODO [W-8291468]: have ingest get called a different way somehow
    ingestFunc: (record: RecordRepresentation) => Promise<void>;
    generateId: (apiName: string) => string;
    isDraftId: (id: string) => boolean;
    apiNameForPrefix: (prefix: string) => Promise<string>;
    prefixForApiName: (apiName: string) => Promise<string | null>;
    ensureObjectInfoCached: (apiName: string, entry?: ObjectInfoRepresentation) => Promise<void>;
    userId: string;
    registerDraftIdMapping: (draftId: string, canonicalId: string) => void;
    getObjectInfo: Adapter<GetObjectInfoConfig, ObjectInfoRepresentation>;
}

export function makeEnvironmentDraftAware(
    env: DurableEnvironment,
    options: AllDraftEnvironmentOptions
): Environment {
    const { draftQueue, ingestFunc, durableStore, registerDraftIdMapping, userId } = options;

    // ingest state objects
    let draftActionMap: DraftActionMap | null = null;
    let objectInfoMap: Record<string, ObjectInfoRepresentation> = {};
    let collectedFields: Record<string, FieldValueRepresentationNormalized> = ObjectCreate(null);

    function onDraftActionCompleting(event: DraftQueueCompleteEvent) {
        const { action } = event;
        if (isLDSDraftAction(action)) {
            const { data: request, tag } = action;
            const { method } = request;

            if (method === 'delete') {
                env.storeEvict(tag);
                env.storeBroadcast(env.rebuildSnapshot, env.snapshotAvailable);
                return Promise.resolve();
            }
            const record = action.response.body as RecordRepresentation;

            return ingestFunc(record).then(() => {
                collectedFields = ObjectCreate(null);
                draftActionMap = null;
                return env.publishChangesToDurableStore();
            });
        }
        return Promise.resolve();
    }

    // register for when the draft queue completes an upload so we can properly
    // update subscribers
    draftQueue.registerOnChangedListener((event: DraftQueueEvent): Promise<void> => {
        if (event.type === DraftQueueEventType.ActionCompleting) {
            return onDraftActionCompleting(event);
        }

        return Promise.resolve();
    });

    /**
     * Intercepts durable store changes to determine if a change to a draft action was made.
     * If a DraftAction changes, we need to evict the affected record from the in memory store
     * So it rebuilds with the new draft action applied to it
     */

    durableStore.registerOnChangedListener((changes: DurableStoreChange[]) => {
        const draftIdMappingsIds: string[] = [];

        for (let i = 0, len = changes.length; i < len; i++) {
            const change = changes[i];
            if (change.segment === DRAFT_ID_MAPPINGS_SEGMENT) {
                draftIdMappingsIds.push(...change.ids);
            }
        }

        if (draftIdMappingsIds.length > 0) {
            return durableStore
                .getEntries(draftIdMappingsIds, DRAFT_ID_MAPPINGS_SEGMENT)
                .then((mappingEntries) => {
                    if (mappingEntries === undefined) {
                        return;
                    }
                    const keys = ObjectKeys(mappingEntries);
                    for (let i = 0, len = keys.length; i < len; i++) {
                        const key = keys[i];
                        const entry = mappingEntries[key] as DurableStoreEntry<DraftIdMappingEntry>;
                        const { draftId, canonicalId } = entry.data;
                        registerDraftIdMapping(draftId, canonicalId);

                        const draftKey = getRecordKeyForId(draftId);

                        // the mapping is setup, we can now delete the original draft
                        return durableStore.evictEntries([draftKey], DefaultDurableSegment);
                    }
                });
        }
    });

    const synthesizers = [
        getRecordDraftEnvironment,
        deleteRecordDraftEnvironment,
        updateRecordDraftEnvironment,
        createRecordDraftEnvironment,
        getRecordsDraftEnvironment,
    ];

    const adapterSpecificEnvironments = synthesizers.reduce((environment, synthesizer) => {
        return synthesizer(environment, options);
    }, env);

    const handleSuccessResponse: typeof env['handleSuccessResponse'] = function <
        IngestionReturnType extends Snapshot<D, V> | undefined,
        D,
        V = unknown
    >(
        ingestAndBroadcastFunc: () => IngestionReturnType,
        getResponseCacheKeysFunc: () => CacheKeySet
    ): IngestionReturnType | Promise<IngestionReturnType> {
        const cacheKeySet = getResponseCacheKeysFunc();
        const cacheKeys = ObjectKeys(cacheKeySet);
        const recordKeysToPrime: Record<string, true> = {};

        for (const cacheKey of cacheKeys) {
            const key = cacheKeySet[cacheKey];

            if (key.representationName === RECORD_REPRESENTATION_NAME) {
                // revive records
                if (isStoreKeyRecordField(cacheKey) === false) {
                    recordKeysToPrime[cacheKey] = true;
                }
            } else if (key.namespace === 'GraphQL') {
                // revive gql
                recordKeysToPrime[cacheKey] = true;
            }
        }

        // if we don't need to prime any data into ingest staging store then
        // no need to do the draft/object info async lookups
        if (ObjectKeys(recordKeysToPrime).length === 0) {
            draftActionMap = null;
            objectInfoMap = ObjectCreate(null);
            return env.handleSuccessResponse(ingestAndBroadcastFunc, getResponseCacheKeysFunc);
        }

        return draftQueue.getActionsForTags(recordKeysToPrime).then((draftMap) => {
            const mapKeys = ObjectKeys(draftMap);
            const apiNames: Record<string, true> = {};
            for (const mapKey of mapKeys) {
                const drafts = draftMap[mapKey];
                if (drafts.length > 0) {
                    const apiName = drafts[0].metadata[LDS_ACTION_METADATA_API_NAME];
                    apiNames[apiName] = true;
                }
            }

            return getObjectInfos(durableStore, ObjectKeys(apiNames)).then((objectInfos) => {
                // TODO [W-10066570]: check if the data to prime staging store with already
                // exists in L1 so we can grab it from there instead of L2 lookup
                return durableStore
                    .getEntries(ObjectKeys(recordKeysToPrime), DefaultDurableSegment)
                    .then((entries) => {
                        const existingL2Records = ObjectCreate(null);
                        publishDurableStoreEntries(
                            entries,
                            (key, record) => {
                                existingL2Records[key] = record;
                            },
                            // we don't need to prime metadata
                            () => {}
                        );
                        draftActionMap = draftMap;
                        objectInfoMap = objectInfos;
                        return env.handleSuccessResponse(
                            ingestAndBroadcastFunc,
                            getResponseCacheKeysFunc,
                            existingL2Records
                        );
                    });
            });
        });
    };

    const storePublish: DurableEnvironment['storePublish'] = function (key: string, data: any) {
        const recordId = extractRecordIdFromStoreKey(key);
        if (recordId === undefined) {
            return env.storePublish(key, data);
        }

        const recordKey = keyBuilderRecord({ recordId });

        // if there's no drafts or this isn't a record or a record field, then just delegate the publish
        if (
            draftActionMap === null ||
            draftActionMap[recordKey] === undefined ||
            draftActionMap[recordKey].length === 0
        ) {
            return env.storePublish(key, data);
        }

        const drafts = draftActionMap[recordKey] as DraftAction<
            RecordRepresentation,
            ResourceRequest
        >[];

        if (isStoreKeyRecordField(key)) {
            // collect the fields, don't publish until the record is published
            collectedFields[key] = { ...data };
            return;
        }

        // otherwise it's a record, now start the draft replaying and publishing

        const record = data as RecordRepresentationNormalized;
        const { apiName } = record;
        const objectInfo = objectInfoMap[apiName];

        const resultWithDrafts = applyDrafts(
            recordKey,
            record,
            collectedFields,
            drafts,
            objectInfo,
            userId
        );

        // apply drafts to fields and publish them
        ObjectKeys(resultWithDrafts).forEach((key) => {
            env.storePublish(key, resultWithDrafts[key]);
        });
    };

    const storeBroadcast: DurableEnvironment['storeBroadcast'] = function (
        rebuildSnapshot: SnapshotRebuild<unknown, unknown>,
        snapshotAvailable: any
    ) {
        collectedFields = ObjectCreate(null);
        draftActionMap = null;
        env.storeBroadcast(rebuildSnapshot, snapshotAvailable);
    };

    return ObjectCreate(adapterSpecificEnvironments, {
        storePublish: { value: storePublish },
        storeBroadcast: { value: storeBroadcast },
        handleSuccessResponse: { value: handleSuccessResponse },
    });
}
