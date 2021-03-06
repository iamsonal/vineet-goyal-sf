import type {
    AdapterFactory,
    AdapterRequestContext,
    CacheKeySet,
    ErrorSnapshot,
    FetchResponse,
    GraphNode,
    Luvio,
    Selector,
    Snapshot,
    SnapshotRefresh,
    StoreLookup,
    UnfulfilledSnapshot,
} from '@luvio/engine';
import type { AdapterValidationConfig } from '../../generated/adapters/adapter-utils';
import { keyPrefix } from '../../generated/adapters/adapter-utils';
import type { GetRecordUiConfig } from '../../generated/adapters/getRecordUi';
import { validateAdapterConfig } from '../../generated/adapters/getRecordUi';
import getUiApiRecordUiByRecordIds from '../../generated/resources/getUiApiRecordUiByRecordIds';
import type { RecordLayoutRepresentation } from '../../generated/types/RecordLayoutRepresentation';
import type { RecordUiRepresentation } from '../../generated/types/RecordUiRepresentation';
import {
    TTL as RecordUiRepresentationTTL,
    ingest,
} from '../../generated/types/RecordUiRepresentation';
import type {
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../../generated/types/RecordRepresentation';
import { keyBuilder as recordRepresentationKeyBuilder } from '../../generated/types/RecordRepresentation';
import { dependencyKeyBuilder as recordRepresentationDependencyKeyBuilder } from '../../helpers/RecordRepresentation/merge';
import {
    ArrayPrototypePush,
    JSONParse,
    JSONStringify,
    ObjectAssign,
    ObjectCreate,
    ObjectKeys,
} from '../../util/language';
import {
    markMissingOptionalFields,
    markNulledOutRequiredFields,
    isGraphNode,
} from '../../util/records';
import { dedupe } from '../../validation/utils';
import type { RecordDef } from './selectors';
import { buildRecordUiSelector } from './selectors';
import { getRecordTypeId } from '../../util/records';
import { isFulfilledSnapshot, isStaleSnapshot, isUnfulfilledSnapshot } from '../../util/snapshot';
import type { LayoutType } from '../../primitives/LayoutType';
import type { LayoutMode } from '../../primitives/LayoutMode';
import { getRecordUiMissingRecordLookupFields } from '../../util/record-ui';
import { buildNotFetchableNetworkSnapshot } from '../../util/cache-policy';
import { isPromise } from '../../util/promise';

type GetRecordUiConfigWithDefaults = Omit<
    Required<GetRecordUiConfig>,
    'formFactor' | 'childRelationships' | 'pageSize' | 'updateMru'
> & {
    layoutTypes: LayoutType[];
    modes: LayoutMode[];
};

// Custom adapter config due to `unsupported` items
const GET_RECORDUI_ADAPTER_CONFIG: AdapterValidationConfig = {
    displayName: 'getRecordUi',
    parameters: {
        required: ['recordIds', 'layoutTypes', 'modes'],
        optional: ['optionalFields'],
        unsupported: [
            'formFactor', // W-6220452
            'childRelationships', // W-4421501
            'pageSize', // W-4421501
            'updateMru',
        ],
    },
};

const RECORD_UI_ERROR_STORE_METADATA_PARAMS = {
    ttl: RecordUiRepresentationTTL,
    representationName: '', // emptry string for unknown representation
    namespace: keyPrefix,
};

function buildCachedSelectorKey(key: string): string {
    return `${key}__selector`;
}

function eachLayout(
    recordUi: RecordUiRepresentation,
    cb: (apiName: string, recordTypeId: string, layout: RecordLayoutRepresentation) => void
) {
    const { layouts } = recordUi;
    const layoutApiNames = ObjectKeys(layouts);

    for (let a = 0, len = layoutApiNames.length; a < len; a += 1) {
        const apiName = layoutApiNames[a];
        const apiNameData = layouts[apiName];
        const recordTypeIds = ObjectKeys(apiNameData);

        for (let b = 0, recordTypeIdsLen = recordTypeIds.length; b < recordTypeIdsLen; b += 1) {
            const recordTypeId = recordTypeIds[b];
            const recordTypeData = apiNameData[recordTypeId];
            const layoutTypes = ObjectKeys(recordTypeData);

            for (let c = 0, layoutTypesLen = layoutTypes.length; c < layoutTypesLen; c += 1) {
                const layoutType = layoutTypes[c];
                const layoutTypeData = recordTypeData[layoutType];
                const modes = ObjectKeys(layoutTypeData);

                for (let d = 0, modesLen = modes.length; d < modesLen; d += 1) {
                    const mode = modes[d];
                    const layout = layoutTypeData[mode];

                    cb(apiName, recordTypeId, layout);
                }
            }
        }
    }
}

function collectRecordDefs(resp: RecordUiRepresentation, recordIds: string[]): RecordDef[] {
    const recordDefs: RecordDef[] = [];

    for (let i = 0, len = recordIds.length; i < len; i += 1) {
        const recordId = recordIds[i];
        const recordData = resp.records[recordId];

        ArrayPrototypePush.call(recordDefs, {
            recordId,
            recordData,
            recordTypeId: getRecordTypeId(recordData),
        });
    }

    return recordDefs;
}

function keyBuilder(
    recordIds: string[],
    layoutTypes: LayoutType[],
    modes: LayoutMode[],
    optionalFields: string[]
): string {
    const joinedRecordIds = recordIds.sort().join(',');
    const joinedOptionalFields = optionalFields.sort().join(',');
    const joinedLayoutTypes = layoutTypes.sort().join(',');
    const joinedModes = modes.sort().join(',');
    return `${keyPrefix}::RecordUiRepresentation:${joinedRecordIds}:${joinedLayoutTypes}:${joinedModes}:${joinedOptionalFields}`;
}

function buildSnapshotRefresh(
    luvio: Luvio,
    config: GetRecordUiConfigWithDefaults
): SnapshotRefresh<RecordUiRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config),
    };
}

export function buildCachedSnapshot(
    luvio: Luvio,
    config: GetRecordUiConfigWithDefaults
):
    | Snapshot<RecordUiRepresentation>
    | null
    | UnfulfilledSnapshot<RecordUiRepresentation | Selector, any> {
    const { recordIds, layoutTypes, modes, optionalFields } = config;

    const key = keyBuilder(
        recordIds,
        layoutTypes as LayoutType[],
        modes as LayoutMode[],
        optionalFields
    );
    const cachedSelectorKey = buildCachedSelectorKey(key);

    const cacheSel = luvio.storeLookup<Selector>({
        recordId: cachedSelectorKey,
        node: {
            kind: 'Fragment',
            private: [],
            opaque: true,
        },
        variables: {},
    });

    if (isFulfilledSnapshot(cacheSel)) {
        const cachedSelector = cacheSel.data;

        const cacheData = luvio.storeLookup<RecordUiRepresentation>(
            cachedSelector,
            buildSnapshotRefresh(luvio, config)
        );

        // CACHE HIT or unfulfilled returns snapshot
        if (luvio.snapshotAvailable(cacheData) || isUnfulfilledSnapshot(cacheData)) {
            return cacheData;
        }
    }

    // if getting selector results in unfulfilled snapshot return that
    if (isUnfulfilledSnapshot(cacheSel)) {
        return cacheSel;
    }

    return null;
}

function markRecordUiNulledOutLookupFields(
    recordLookupFields: {
        [key: string]: string[];
    },
    recordNodes: GraphNode<RecordRepresentationNormalized, RecordRepresentation>[]
) {
    for (let i = 0, len = recordNodes.length; i < len; i++) {
        const recordId = recordNodes[i].data.id;
        if (recordLookupFields[recordId] !== undefined) {
            markNulledOutRequiredFields(recordNodes[i], recordLookupFields[recordId]);
        }
    }
}

function markRecordUiOptionalFields(
    optionalFields: string[],
    recordLookupFields: {
        [key: string]: string[];
    },
    recordNodes: GraphNode<RecordRepresentationNormalized, RecordRepresentation>[]
) {
    for (let i = 0, len = recordNodes.length; i < len; i++) {
        const recordId = recordNodes[i].data.id;
        if (optionalFields.length > 0 || recordLookupFields[recordId] !== undefined) {
            markMissingOptionalFields(recordNodes[i], [
                ...optionalFields,
                ...recordLookupFields[recordId],
            ]);
        }
    }
}

function prepareRequest(luvio: Luvio, config: GetRecordUiConfigWithDefaults) {
    const { recordIds, layoutTypes, modes, optionalFields } = config;

    const key = keyBuilder(
        recordIds,
        layoutTypes as LayoutType[],
        modes as LayoutMode[],
        optionalFields
    );
    const selectorKey = buildCachedSelectorKey(key);

    const resourceRequest = getUiApiRecordUiByRecordIds({
        urlParams: {
            recordIds,
        },
        queryParams: {
            layoutTypes,
            modes,
            optionalFields: dedupe(optionalFields).sort(),
        },
    });

    return { key, selectorKey, resourceRequest };
}

// NOTE: getRecordUi is special and we can't use the generated getResponseCacheKeys
// (just like we don't use the generated ingestSuccess).  To get the cache keys
// we have to run ingest code and look at the resulting snapshot's seenRecords.
function getCacheKeys(
    luvio: Luvio,
    config: GetRecordUiConfigWithDefaults,
    key: string,
    originalResponseBody: RecordUiRepresentation
) {
    const { recordIds, layoutTypes, modes } = config;

    const responseBody = JSONParse(JSONStringify(originalResponseBody));

    eachLayout(
        responseBody,
        (apiName: string, recordTypeId: string, layout: RecordLayoutRepresentation) => {
            if (layout.id === null) {
                return;
            }
            const layoutUserState = responseBody.layoutUserStates[layout.id];
            // Temporary hack since we can't match keys from getLayoutUserState response
            // to record ui's layout users states.
            if (layoutUserState === undefined) {
                return;
            }
            layoutUserState.apiName = apiName;
            layoutUserState.recordTypeId = recordTypeId;
            layoutUserState.mode = layout.mode;
            layoutUserState.layoutType = layout.layoutType;
        }
    );

    const recordLookupFields = getRecordUiMissingRecordLookupFields(responseBody);
    const selPath = buildRecordUiSelector(
        collectRecordDefs(responseBody, recordIds),
        layoutTypes,
        modes,
        recordLookupFields
    );

    const sel = {
        recordId: key,
        node: selPath,
        variables: {},
    };

    luvio.storeIngest(key, ingest, responseBody);

    const snapshot = luvio.storeLookup<RecordUiRepresentation>(
        sel,
        buildSnapshotRefresh(luvio, config)
    );

    if (snapshot.state === 'Error') {
        return {};
    }

    const keys = [...ObjectKeys(snapshot.seenRecords), snapshot.recordId];
    const keySet: CacheKeySet = ObjectCreate(null);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const namespace = key.split('::')[0];
        const representationName = key.split('::')[1].split(':')[0];
        keySet[key] = {
            namespace,
            representationName,
        };
    }
    return keySet;
}

function onResourceResponseSuccess(
    luvio: Luvio,
    config: GetRecordUiConfigWithDefaults,
    selectorKey: string,
    key: string,
    responseBody: RecordUiRepresentation
) {
    const { recordIds, layoutTypes, modes, optionalFields } = config;

    // eslint-disable-next-line @salesforce/lds/no-invalid-todo
    // TODO fix API so we don't have to augment the response with request details in order
    // to support refresh. these are never emitted out per (private).
    eachLayout(
        responseBody,
        (apiName: string, recordTypeId: string, layout: RecordLayoutRepresentation) => {
            if (layout.id === null) {
                return;
            }
            const layoutUserState = responseBody.layoutUserStates[layout.id];
            // Temporary hack since we can't match keys from getLayoutUserState response
            // to record ui's layout users states.
            if (layoutUserState === undefined) {
                return;
            }
            layoutUserState.apiName = apiName;
            layoutUserState.recordTypeId = recordTypeId;
            layoutUserState.mode = layout.mode;
            layoutUserState.layoutType = layout.layoutType;
        }
    );

    const recordLookupFields = getRecordUiMissingRecordLookupFields(responseBody);
    const selPath = buildRecordUiSelector(
        collectRecordDefs(responseBody, recordIds),
        layoutTypes,
        modes,
        recordLookupFields
    );

    const sel = {
        recordId: key,
        node: selPath,
        variables: {},
    };

    luvio.storePublish(selectorKey, sel);
    luvio.storeIngest(key, ingest, responseBody);

    // During ingestion, only valid records are stored.
    const recordNodes = [];
    const validRecordIds = [];
    for (let i = 0, len = recordIds.length; i < len; i += 1) {
        const recordId = recordIds[i];
        const recordKey = recordRepresentationKeyBuilder({ recordId });
        const node = luvio.getNode<RecordRepresentationNormalized, RecordRepresentation>(recordKey);
        if (isGraphNode(node)) {
            recordNodes.push(node);
            validRecordIds.push(recordId);
        }
    }

    markRecordUiNulledOutLookupFields(recordLookupFields, recordNodes);
    markRecordUiOptionalFields(optionalFields, recordLookupFields, recordNodes);

    publishDependencies(luvio, validRecordIds, [key, selectorKey]);

    const snapshot = luvio.storeLookup<RecordUiRepresentation>(
        sel,
        buildSnapshotRefresh(luvio, config)
    );

    luvio.storeBroadcast();

    return snapshot;
}

function onResourceResponseError(
    luvio: Luvio,
    config: GetRecordUiConfigWithDefaults,
    selectorKey: string,
    key: string,
    err: FetchResponse<unknown>
) {
    const errorSnapshot = luvio.errorSnapshot(err, buildSnapshotRefresh(luvio, config));
    luvio.storeIngestError(key, errorSnapshot, RECORD_UI_ERROR_STORE_METADATA_PARAMS);
    luvio.storeBroadcast();

    const { status } = err;
    if (status === 404) {
        const sel: Selector = {
            recordId: key,
            node: {
                kind: 'Fragment',
                private: [],
                opaque: true,
            },
            variables: {},
        };
        luvio.storePublish(selectorKey, sel);
        return luvio.storeLookup<RecordUiRepresentation>(
            sel,
            buildSnapshotRefresh(luvio, config)
        ) as ErrorSnapshot;
    }

    return errorSnapshot;
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetRecordUiConfigWithDefaults
): Promise<Snapshot<RecordUiRepresentation>> {
    const { key, resourceRequest, selectorKey } = prepareRequest(luvio, config);

    return luvio.dispatchResourceRequest<RecordUiRepresentation>(resourceRequest).then(
        (response) => {
            return luvio.handleSuccessResponse(
                () => onResourceResponseSuccess(luvio, config, selectorKey, key, response.body),
                () => getCacheKeys(luvio, config, key, response.body)
            );
        },
        (err: FetchResponse<unknown>) => {
            return luvio.handleErrorResponse(() => {
                return onResourceResponseError(luvio, config, selectorKey, key, err);
            });
        }
    );
}

function publishDependencies(luvio: Luvio, recordIds: string[], depKeys: string[]) {
    for (let i = 0, len = recordIds.length; i < len; i += 1) {
        const recordDepKey = recordRepresentationDependencyKeyBuilder({ recordId: recordIds[i] });

        const dependencies = ObjectCreate(null);
        for (let j = 0, len = depKeys.length; j < len; j++) {
            dependencies[depKeys[j]] = true;
        }

        const node = luvio.getNode<{ [key: string]: true }, any>(recordDepKey);
        if (isGraphNode(node)) {
            const recordDeps = (node as GraphNode<{ [key: string]: true }, any>).retrieve();
            ObjectAssign(dependencies, recordDeps);
        }

        luvio.storePublish(recordDepKey, dependencies);
    }
}

type BuildSelectorSnapshotContext = {
    config: GetRecordUiConfigWithDefaults;
    luvio: Luvio;
};

function buildCachedSelectorSnapshot(
    context: BuildSelectorSnapshotContext,
    storeLookup: StoreLookup<Selector<RecordUiRepresentation>>
): Snapshot<Selector<RecordUiRepresentation>> | undefined {
    const { config } = context;
    const { recordIds, layoutTypes, modes, optionalFields } = config;

    const key = keyBuilder(
        recordIds,
        layoutTypes as LayoutType[],
        modes as LayoutMode[],
        optionalFields
    );
    const cachedSelectorKey = buildCachedSelectorKey(key);

    return storeLookup({
        recordId: cachedSelectorKey,
        node: {
            kind: 'Fragment',
            private: [],
            opaque: true,
        },
        variables: {},
    });
}

type BuildRecordUiRepresentationSnapshotContext = {
    config: GetRecordUiConfigWithDefaults;
    luvio: Luvio;
    selector: Selector<RecordUiRepresentation> | undefined;
};

function buildCachedRecordUiRepresentationSnapshot(
    context: BuildRecordUiRepresentationSnapshotContext,
    storeLookup: StoreLookup<RecordUiRepresentation>
): Snapshot<RecordUiRepresentation> | undefined {
    const { config, luvio, selector } = context;

    // try to resolve RecordUiRepresentation selector if previous steps were able to find one
    if (selector !== undefined) {
        return storeLookup(selector, buildSnapshotRefresh(luvio, config));
    }
}

function buildNetworkRecordUiRepresentationSnapshot(
    context: BuildRecordUiRepresentationSnapshotContext
): Promise<Snapshot<RecordUiRepresentation>> {
    return buildNetworkSnapshot(context.luvio, context.config);
}

export function coerceConfigWithDefaults(
    untrustedConfig: unknown
): GetRecordUiConfigWithDefaults | null {
    const config = validateAdapterConfig(untrustedConfig, GET_RECORDUI_ADAPTER_CONFIG);
    if (config === null) {
        return null;
    }

    const { layoutTypes, modes } = config;
    // custom config validation
    if (layoutTypes === undefined || modes === undefined) {
        return null;
    }

    return {
        ...config,
        layoutTypes: layoutTypes as LayoutType[],
        modes: modes as LayoutMode[],
        optionalFields: config.optionalFields === undefined ? [] : config.optionalFields,
    };
}

export const factory: AdapterFactory<GetRecordUiConfig, RecordUiRepresentation> = (luvio: Luvio) =>
    function UiApi__getRecordUi(
        untrustedConfig: unknown,
        requestContext?: AdapterRequestContext
    ): Promise<Snapshot<RecordUiRepresentation>> | Snapshot<RecordUiRepresentation> | null {
        // standard config validation and coercion
        const config = coerceConfigWithDefaults(untrustedConfig);
        if (config === null) {
            return null;
        }

        const definedRequestContext = requestContext || {};

        const selectorPromiseOrSnapshot = luvio.applyCachePolicy(
            definedRequestContext,
            { config, luvio },
            buildCachedSelectorSnapshot,
            buildNotFetchableNetworkSnapshot(luvio)
        );

        const resolveSelector = (selectorSnapshot: Snapshot<Selector<RecordUiRepresentation>>) => {
            const selector =
                isFulfilledSnapshot(selectorSnapshot) || isStaleSnapshot(selectorSnapshot)
                    ? selectorSnapshot.data
                    : undefined;

            return luvio.applyCachePolicy(
                definedRequestContext,
                { config, luvio, selector },
                buildCachedRecordUiRepresentationSnapshot,
                buildNetworkRecordUiRepresentationSnapshot
            );
        };

        return isPromise(selectorPromiseOrSnapshot)
            ? selectorPromiseOrSnapshot.then(resolveSelector)
            : resolveSelector(selectorPromiseOrSnapshot);
    };
