import {
    AdapterFactory,
    LDS,
    Snapshot,
    Selector,
    FetchResponse,
    GraphNode,
    ErrorSnapshot,
    SnapshotRefresh,
} from '@ldsjs/engine';
import { AdapterValidationConfig, keyPrefix } from '../../generated/adapters/adapter-utils';
import { GetRecordUiConfig, validateAdapterConfig } from '../../generated/adapters/getRecordUi';
import getUiApiRecordUiByRecordIds from '../../generated/resources/getUiApiRecordUiByRecordIds';
import { RecordLayoutRepresentation } from '../../generated/types/RecordLayoutRepresentation';
import {
    RecordUiRepresentation,
    TTL as RecordUiRepresentationTTL,
} from '../../generated/types/RecordUiRepresentation';
import {
    keyBuilder as recordRepresentationKeyBuilder,
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../../generated/types/RecordRepresentation';
import { depenpendencyKeyBuilder as recordRepresentationDependencyKeyBuilder } from '../../helpers/RecordRepresentation/merge';
import {
    ArrayPrototypePush,
    JSONStringify,
    ObjectAssign,
    ObjectCreate,
    ObjectKeys,
} from '../../util/language';
import { getTrackedFields, markMissingOptionalFields, isGraphNode } from '../../util/records';
import { dedupe } from '../../validation/utils';
import { buildRecordUiSelector, RecordDef } from './selectors';
import { getRecordTypeId } from '../../util/records';
import { isFulfilledSnapshot } from '../../util/snapshot';
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
    lds: LDS,
    config: GetRecordUiConfigWithDefaults
): SnapshotRefresh<RecordUiRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(lds, config),
    };
}

export function buildInMemorySnapshot(
    lds: LDS,
    config: GetRecordUiConfigWithDefaults
): Snapshot<RecordUiRepresentation> | null {
    const { recordIds, layoutTypes, modes, optionalFields } = config;

    // TODO: a better hash function for config -> configKey
    const configKey = JSONStringify(config);

    // check to see if we see the selector (config) before
    const selectorNode = getSelectorNode(lds, configKey);

    // if we do, return the same snapshot instance by calling storeLookupMemoize
    if (selectorNode !== null) {
        const cacheData = lds.storeLookupMemoize<RecordUiRepresentation>(
            selectorNode,
            buildSnapshotRefresh(lds, config)
        );

        // CACHE HIT
        if (lds.snapshotDataAvailable(cacheData)) {
            return cacheData;
        }
    }

    const key = keyBuilder(
        recordIds,
        layoutTypes as LayoutType[],
        modes as LayoutMode[],
        optionalFields
    );

    const cachedSelectorKey = `${key}__selector`;

    const cacheSel = lds.storeLookup<Selector>({
        recordId: cachedSelectorKey,
        node: {
            kind: 'Fragment',
            opaque: true,
        },
        variables: {},
    });

    if (isFulfilledSnapshot(cacheSel)) {
        const cachedSelector = cacheSel.data;

        // publish the selector instance for later getNode check
        lds.storePublish(configKey, cachedSelector);

        const cacheData = lds.storeLookupMemoize<RecordUiRepresentation>(
            cachedSelector,
            buildSnapshotRefresh(lds, config)
        );

        // CACHE HIT
        if (lds.snapshotDataAvailable(cacheData)) {
            return cacheData;
        }
    }

    return null;
}

function markRecordUiOptionalFields(
    lds: LDS,
    optionalFields: string[],
    recordNodes: GraphNode<RecordRepresentationNormalized, RecordRepresentation>[]
) {
    if (optionalFields.length === 0) {
        return;
    }

    for (let i = 0, len = recordNodes.length; i < len; i++) {
        markMissingOptionalFields(recordNodes[i], optionalFields);
    }
}

function getSelectorNode(lds: LDS, key: string): null | Selector {
    const selectorNode = lds.getNode<Selector, any>(key);
    if (selectorNode !== null) {
        return (selectorNode as GraphNode<Selector>).retrieve();
    }

    return null;
}

export function buildNetworkSnapshot(
    lds: LDS,
    config: GetRecordUiConfigWithDefaults
): Promise<Snapshot<RecordUiRepresentation>> {
    const { recordIds, layoutTypes, modes, optionalFields } = config;

    // TODO: a better hash function for config -> configKey
    const configKey = JSONStringify(config);

    let allOptionalFields: string[] = [];
    for (let i = 0, len = recordIds.length; i < len; i++) {
        const recordId = recordIds[i];
        allOptionalFields = allOptionalFields.concat(
            getTrackedFields(lds, recordId, optionalFields)
        );
    }

    const key = keyBuilder(
        recordIds,
        layoutTypes as LayoutType[],
        modes as LayoutMode[],
        optionalFields
    );
    const resourceRequest = getUiApiRecordUiByRecordIds({
        urlParams: {
            recordIds,
        },
        queryParams: {
            layoutTypes,
            modes,
            optionalFields: dedupe(allOptionalFields).sort(),
        },
    });

    return lds.dispatchResourceRequest<RecordUiRepresentation>(resourceRequest).then(
        response => {
            const { body } = response;

            // TODO fix API so we don't have to augment the response with request details in order
            // to support refresh. these are never emitted out per (private).
            eachLayout(
                body,
                (apiName: string, recordTypeId: string, layout: RecordLayoutRepresentation) => {
                    if (layout.id === null) {
                        return;
                    }
                    const layoutUserState = body.layoutUserStates[layout.id];
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

            const cachedSelectorKey = `${key}__selector`;
            const recordLookupFields = getRecordUiMissingRecordLookupFields(body);
            const selPath = buildRecordUiSelector(
                collectRecordDefs(body, recordIds),
                layoutTypes,
                modes,
                recordLookupFields
            );

            const sel = {
                recordId: key,
                node: selPath,
                variables: {},
            };

            lds.storePublish(cachedSelectorKey, sel);
            lds.storeIngest(key, resourceRequest, body);

            // During ingestion, only valid records are stored.
            const recordNodes = [];
            const validRecordIds = [];
            for (let i = 0, len = recordIds.length; i < len; i += 1) {
                const recordId = recordIds[i];
                const recordKey = recordRepresentationKeyBuilder({ recordId });
                const node = lds.getNode<RecordRepresentationNormalized, RecordRepresentation>(
                    recordKey
                );
                if (isGraphNode(node)) {
                    recordNodes.push(node);
                    validRecordIds.push(recordId);
                }
            }

            const { optionalFields } = config;
            if (optionalFields.length > 0) {
                markRecordUiOptionalFields(lds, optionalFields, recordNodes);
            }

            lds.storeBroadcast();
            lds.storePublish(configKey, sel);
            publishDependencies(lds, validRecordIds, [key, cachedSelectorKey, configKey]);

            return lds.storeLookupMemoize<RecordUiRepresentation>(
                sel,
                buildSnapshotRefresh(lds, config)
            );
        },
        (err: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(key, err, RecordUiRepresentationTTL);
            lds.storeBroadcast();

            const { status } = err;
            if (status === 404) {
                const sel: Selector = {
                    recordId: key,
                    node: {
                        kind: 'Fragment',
                        opaque: true,
                    },
                    variables: {},
                };
                lds.storePublish(configKey, sel);
                return lds.storeLookupMemoize<RecordUiRepresentation>(
                    sel,
                    buildSnapshotRefresh(lds, config)
                ) as ErrorSnapshot;
            }

            return lds.errorSnapshot(err, buildSnapshotRefresh(lds, config));
        }
    );
}

function publishDependencies(lds: LDS, recordIds: string[], depKeys: string[]) {
    for (let i = 0, len = recordIds.length; i < len; i += 1) {
        const recordDepKey = recordRepresentationDependencyKeyBuilder({ recordId: recordIds[i] });

        const dependencies = ObjectCreate(null);
        for (let j = 0, len = depKeys.length; j < len; j++) {
            dependencies[depKeys[j]] = true;
        }

        const node = lds.getNode<{ [key: string]: true }, any>(recordDepKey);
        if (isGraphNode(node)) {
            const recordDeps = (node as GraphNode<{ [key: string]: true }, any>).retrieve();
            ObjectAssign(dependencies, recordDeps);
        }

        lds.storePublish(recordDepKey, dependencies);
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

export const factory: AdapterFactory<GetRecordUiConfig, RecordUiRepresentation> = (lds: LDS) =>
    function getRecordUi(
        untrustedConfig: unknown
    ): Promise<Snapshot<RecordUiRepresentation>> | Snapshot<RecordUiRepresentation> | null {
        // standard config validation and coercion
        const config = coerceConfigWithDefaults(untrustedConfig);
        if (config === null) {
            return null;
        }

        const cacheSnapshot = buildInMemorySnapshot(lds, config);
        if (cacheSnapshot !== null) {
            return cacheSnapshot;
        }

        return buildNetworkSnapshot(lds, config);
    };
