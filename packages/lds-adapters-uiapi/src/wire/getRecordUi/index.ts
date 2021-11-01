import {
    AdapterFactory,
    AdapterRequestContext,
    CacheKeySet,
    DispatchResourceRequest,
    ErrorSnapshot,
    FetchResponse,
    FulfilledSnapshot,
    GraphNode,
    Luvio,
    Selector,
    Snapshot,
    SnapshotRefresh,
    StaleSnapshot,
    StoreLookup,
    UnAvailableSnapshot,
    UnfulfilledSnapshot,
} from '@luvio/engine';
import { AdapterValidationConfig, keyPrefix } from '../../generated/adapters/adapter-utils';
import { GetRecordUiConfig, validateAdapterConfig } from '../../generated/adapters/getRecordUi';
import getUiApiRecordUiByRecordIds from '../../generated/resources/getUiApiRecordUiByRecordIds';
import { RecordLayoutRepresentation } from '../../generated/types/RecordLayoutRepresentation';
import {
    RecordUiRepresentation,
    TTL as RecordUiRepresentationTTL,
    ingest,
} from '../../generated/types/RecordUiRepresentation';
import {
    keyBuilder as recordRepresentationKeyBuilder,
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../../generated/types/RecordRepresentation';
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
import { buildRecordUiSelector, RecordDef } from './selectors';
import { getRecordTypeId } from '../../util/records';
import { isFulfilledSnapshot, isStaleSnapshot, isUnfulfilledSnapshot } from '../../util/snapshot';
import { LayoutType } from '../../primitives/LayoutType';
import { LayoutMode } from '../../primitives/LayoutMode';
import { getRecordUiMissingRecordLookupFields } from '../../util/record-ui';

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

export function buildInMemorySnapshot(
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

    const cacheSel = luvio.storeLookup<Selector>(
        {
            recordId: cachedSelectorKey,
            node: {
                kind: 'Fragment',
                private: [],
                opaque: true,
            },
            variables: {},
        },
        // TODO [W-9601746]: today makeDurable environment needs a refresh set for
        // "resolveSnapshot" override to work properly, but once this work
        // item is done we won't need to pass in a refresh here
        buildSnapshotRefresh(luvio, config) as unknown as SnapshotRefresh<Selector>
    );

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

function isSelectorSnapshotWithData(
    snapshot: Snapshot<Selector | RecordUiRepresentation>
): snapshot is FulfilledSnapshot<Selector> | StaleSnapshot<Selector> {
    return (
        (snapshot.state === 'Fulfilled' || snapshot.state === 'Stale') &&
        'node' in (snapshot.data as Selector)
    );
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
            return onResourceResponseError(luvio, config, selectorKey, key, err);
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

function buildInMemorySelectorSnapshot(
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

function buildNetworkSelectorSnapshot(
    context: BuildSelectorSnapshotContext,
    _dispatchResourceRequest: DispatchResourceRequest<Selector<RecordUiRepresentation>>
): Promise<Snapshot<Selector<RecordUiRepresentation>>> {
    const { luvio } = context;

    // We save the Selector in L1/L2, but it's not possible to actually retrieve it over
    // the network. Just return an error snapshot to let the adapter know that it should
    // skip trying to use the cached Selector to build the RecordUiRepresentation.
    return Promise.resolve(
        luvio.errorSnapshot({
            status: 400,
            body: undefined,
            statusText: 'cannot request selector',
            ok: false,
            headers: {},
        })
    );
}

type BuildRecordUiRepresentationSnapshotContext = {
    config: GetRecordUiConfigWithDefaults;
    luvio: Luvio;
    selector: Selector<RecordUiRepresentation> | undefined;
};

function buildInMemoryRecordUiRepresentationSnapshot(
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
    context: BuildRecordUiRepresentationSnapshotContext,
    _dispatchResourceRequest: DispatchResourceRequest<RecordUiRepresentation>
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

function isPromise<T>(value: Promise<T> | T): value is Promise<T> {
    return (value as any).then !== undefined;
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

        if (requestContext !== undefined) {
            const cachePolicy =
                requestContext === undefined ? undefined : requestContext.cachePolicy;

            const selectorPromiseOrSnapshot = luvio.applyCachePolicy(
                cachePolicy,
                { config, luvio },
                buildInMemorySelectorSnapshot,
                buildNetworkSelectorSnapshot
            );

            const resolveSelector = (
                selectorSnapshot: Snapshot<Selector<RecordUiRepresentation>>
            ) => {
                const selector =
                    isFulfilledSnapshot(selectorSnapshot) || isStaleSnapshot(selectorSnapshot)
                        ? selectorSnapshot.data
                        : undefined;

                return luvio.applyCachePolicy(
                    cachePolicy,
                    { config, luvio, selector },
                    buildInMemoryRecordUiRepresentationSnapshot,
                    buildNetworkRecordUiRepresentationSnapshot
                );
            };

            return isPromise(selectorPromiseOrSnapshot)
                ? selectorPromiseOrSnapshot.then(resolveSelector)
                : resolveSelector(selectorPromiseOrSnapshot);
        }

        const cacheSnapshot = buildInMemorySnapshot(luvio, config);

        // if snapshot is null go right to network
        if (cacheSnapshot === null) {
            return buildNetworkSnapshot(luvio, config);
        }

        if (isUnfulfilledSnapshot(cacheSnapshot)) {
            const snapshotRefresh = buildSnapshotRefresh(luvio, config);

            return luvio
                .resolveSnapshot(
                    cacheSnapshot as UnAvailableSnapshot<RecordUiRepresentation | Selector>,
                    snapshotRefresh
                )
                .then((resolvedSnapshot) => {
                    // In default environment resolving a snapshot is just hitting the network
                    // with the given SnapshotRefresh (so record-ui in this case).  In durable environment
                    // resolving a snapshot will first attempt to read the missing cache keys
                    // from the given UnAvailable snapshot (a record-ui snapshot or selector snapshot in this
                    // case) and build a Fulfilled snapshot from that if those cache keys are present, otherwise
                    // it hits the network with the given resource request.  Usually the SnapshotRefresh and the
                    // UnAvailable snapshot are for the same response Type, but this adapter is special (it
                    // stores its own selectors in the store), and so our use of resolveSnapshot
                    // is special (polymorphic response, could either be a record-ui representation or a
                    // selector).

                    // if the response is a selector then we can attempt to build a snapshot
                    // with that selector
                    if (isSelectorSnapshotWithData(resolvedSnapshot)) {
                        const dataSnapshot = luvio.storeLookup<RecordUiRepresentation>(
                            resolvedSnapshot.data,
                            snapshotRefresh
                        );

                        if (luvio.snapshotAvailable(dataSnapshot)) {
                            return dataSnapshot;
                        }

                        return luvio.resolveSnapshot(dataSnapshot, snapshotRefresh);
                    }

                    // otherwise it's a record-ui response
                    return resolvedSnapshot as Snapshot<RecordUiRepresentation>;
                });
        }

        // if we got here then we can just return the in-memory snapshot
        return cacheSnapshot;
    };
