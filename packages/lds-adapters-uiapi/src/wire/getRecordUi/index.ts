import {
    AdapterFactory,
    Luvio,
    Snapshot,
    Selector,
    FetchResponse,
    GraphNode,
    ErrorSnapshot,
    SnapshotRefresh,
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
import { depenpendencyKeyBuilder as recordRepresentationDependencyKeyBuilder } from '../../helpers/RecordRepresentation/merge';
import { ArrayPrototypePush, ObjectAssign, ObjectCreate, ObjectKeys } from '../../util/language';
import {
    markMissingOptionalFields,
    markNulledOutRequiredFields,
    isGraphNode,
} from '../../util/records';
import { dedupe } from '../../validation/utils';
import { buildRecordUiSelector, RecordDef } from './selectors';
import { getRecordTypeId } from '../../util/records';
import { isFulfilledSnapshot, isUnfulfilledSnapshot } from '../../util/snapshot';
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
    return `${keyPrefix}RecordUiRepresentation:${joinedRecordIds}:${joinedLayoutTypes}:${joinedModes}:${joinedOptionalFields}`;
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
        if (luvio.snapshotDataAvailable(cacheData) || isUnfulfilledSnapshot(cacheData)) {
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

function onResourceResponseSuccess(
    luvio: Luvio,
    config: GetRecordUiConfigWithDefaults,
    selectorKey: string,
    key: string,
    responseBody: RecordUiRepresentation
) {
    const { recordIds, layoutTypes, modes, optionalFields } = config;

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

    luvio.storeBroadcast();
    publishDependencies(luvio, validRecordIds, [key, selectorKey]);

    return luvio.storeLookup<RecordUiRepresentation>(sel, buildSnapshotRefresh(luvio, config));
}

function onResourceResponseError(
    luvio: Luvio,
    config: GetRecordUiConfigWithDefaults,
    selectorKey: string,
    key: string,
    err: FetchResponse<unknown>
) {
    luvio.storeIngestFetchResponse(key, err, RecordUiRepresentationTTL);
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

    return luvio.errorSnapshot(err, buildSnapshotRefresh(luvio, config));
}

function isSelector(data: Selector | RecordUiRepresentation): data is Selector {
    return (data as Selector).node !== undefined;
}

function resolveUnfulfilledSnapshot(
    luvio: Luvio,
    config: GetRecordUiConfigWithDefaults,
    snapshot: UnfulfilledSnapshot<Selector | RecordUiRepresentation, any>
): Promise<Snapshot<RecordUiRepresentation>> {
    const { resourceRequest, key, selectorKey } = prepareRequest(luvio, config);

    // In default environment resolving an unfulfilled snapshot is just hitting the network
    // with the given ResourceRequest (so record-ui in this case).  In durable environment
    // resolving an unfulfilled snapshot will first attempt to read the missing cache keys
    // from the given unfulfilled snapshot (a record-ui snapshot or selector snapshot in this
    // case) and build a fulfilled snapshot from that if those cache keys are present, otherwise
    // it hits the network with the given resource request.  Usually the ResourceRequest and the
    // unfulfilled snapshot are for the same response Type, but this adapter is special (it
    // stores its own selectors in the store), and so our use of resolveUnfulfilledSnapshot
    // is special (polymorphic response, could either be a record-ui representation or a
    // selector).
    return luvio.resolveUnfulfilledSnapshot(resourceRequest, snapshot).then(
        response => {
            const { body } = response;

            // if the response is a selector then we can attempt to build a snapshot
            // with that selector
            if (isSelector(body)) {
                const dataSnapshot = luvio.storeLookup<RecordUiRepresentation>(
                    body,
                    buildSnapshotRefresh(luvio, config)
                );
                if (luvio.snapshotDataAvailable(dataSnapshot)) {
                    return dataSnapshot;
                }
                if (isUnfulfilledSnapshot(dataSnapshot)) {
                    return resolveUnfulfilledSnapshot(luvio, config, dataSnapshot);
                }
                return buildNetworkSnapshot(luvio, config);
            }

            // otherwise it's a record-ui response
            return onResourceResponseSuccess(luvio, config, selectorKey, key, body);
        },
        (err: FetchResponse<unknown>) => {
            return onResourceResponseError(luvio, config, selectorKey, key, err);
        }
    );
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetRecordUiConfigWithDefaults
): Promise<Snapshot<RecordUiRepresentation>> {
    const { key, resourceRequest, selectorKey } = prepareRequest(luvio, config);

    return luvio.dispatchResourceRequest<RecordUiRepresentation>(resourceRequest).then(
        response => {
            return onResourceResponseSuccess(luvio, config, selectorKey, key, response.body);
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
        untrustedConfig: unknown
    ): Promise<Snapshot<RecordUiRepresentation>> | Snapshot<RecordUiRepresentation> | null {
        // standard config validation and coercion
        const config = coerceConfigWithDefaults(untrustedConfig);
        if (config === null) {
            return null;
        }

        const cacheSnapshot = buildInMemorySnapshot(luvio, config);

        // if snapshot is null go right to network
        if (cacheSnapshot === null) {
            return buildNetworkSnapshot(luvio, config);
        }

        if (isUnfulfilledSnapshot(cacheSnapshot)) {
            return resolveUnfulfilledSnapshot(luvio, config, cacheSnapshot);
        }

        // if we got here then we can just return the in-memory snapshot
        return cacheSnapshot;
    };
