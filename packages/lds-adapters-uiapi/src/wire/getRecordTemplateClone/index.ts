import {
    AdapterFactory,
    Luvio,
    Snapshot,
    FulfilledSnapshot,
    ResourceRequestOverride,
    Selector,
    FetchResponse,
    AdapterContext,
    StoreLookup,
    AdapterRequestContext,
    CoercedAdapterRequestContext,
} from '@luvio/engine';
import {
    validateAdapterConfig,
    getRecordTemplateClone_ConfigPropertyNames,
    createResourceParams,
    buildCachedSnapshot as generatedBuildCachedSnapshot,
    buildNetworkSnapshot as generatedBuildNetworkSnapshot,
    GetRecordTemplateCloneConfig,
} from '../../generated/adapters/getRecordTemplateClone';
import { createResourceRequest } from '../../generated/resources/getUiApiRecordDefaultsTemplateCloneByRecordId';
import { select } from '../../raml-artifacts/resources/getUiApiRecordDefaultsTemplateCloneByRecordId/select';
import {
    RecordDefaultsTemplateCloneRepresentation,
    TTL as RecordTemplateCloneTTL,
} from '../../generated/types/RecordDefaultsTemplateCloneRepresentation';
import { ObjectInfoRepresentation } from '../../generated/types/ObjectInfoRepresentation';
import { keyBuilder as templateRecordKeyBuilder } from '../../generated/types/RecordTemplateCloneRepresentation';
import {
    BLANK_RECORD_FIELDS_TRIE,
    convertFieldsToTrie,
    getTrackedFields,
} from '../../util/records';
import { keyPrefix, snapshotRefreshOptions } from '../../generated/adapters/adapter-utils';
import {
    keyBuilder as templateKeyBuilder,
    keyBuilderFromType as templateKeyBuilderFromType,
} from '../../generated/types/RecordDefaultsTemplateCloneRepresentation';
import { createFieldsIngestSuccess as resourceCreateFieldsIngest } from '../../generated/fields/resources/getUiApiRecordDefaultsTemplateCloneByRecordId';
import { configuration } from '../../configuration';

const DEFAULT_RECORD_TYPE_ID_KEY = 'defaultRecordTypeId';
const RECORD_TEMPLATE_CLONE_ERROR_STORE_METADATA_PARAMS = {
    ttl: RecordTemplateCloneTTL,
    representationName: '', // empty string for unknown representation
    namespace: keyPrefix,
};

function saveDefaultRecordTypeId(context: AdapterContext, objectInfo: ObjectInfoRepresentation) {
    context.set(DEFAULT_RECORD_TYPE_ID_KEY, objectInfo.defaultRecordTypeId);
}

function getRecordTypeId(
    adapterConfig: GetRecordTemplateCloneConfig,
    context: AdapterContext
): string | undefined {
    const { recordTypeId } = adapterConfig;
    if (recordTypeId !== undefined && recordTypeId !== null) {
        return recordTypeId;
    }

    const contextValue = context.get<string | null>(DEFAULT_RECORD_TYPE_ID_KEY);

    if (contextValue === null || contextValue === undefined) {
        return undefined;
    }

    return contextValue;
}

const buildNetworkSnapshot: (
    luvio: Luvio,
    context: AdapterContext,
    config: GetRecordTemplateCloneConfig,
    override?: ResourceRequestOverride
) => ReturnType<typeof generatedBuildNetworkSnapshot> = (
    luvio: Luvio,
    context: AdapterContext,
    config: GetRecordTemplateCloneConfig,
    override?: ResourceRequestOverride
) => {
    const resourceParams = createResourceParams(config);
    const recordTypeId = getRecordTypeId(config, context);
    const { recordId } = config;
    const resourceRequest = createResourceRequest(resourceParams);
    const coercedRecordTypeId = recordTypeId === undefined ? null : recordTypeId;
    const templateRecordKey = templateRecordKeyBuilder({
        cloneSourceId: recordId,
        recordTypeId: coercedRecordTypeId,
    });

    const request =
        recordTypeId === undefined
            ? resourceRequest
            : createResourceRequest({
                  ...resourceParams,
                  queryParams: {
                      ...resourceRequest.queryParams,
                      optionalFields: getTrackedFields(
                          templateRecordKey,
                          luvio.getNode(templateRecordKey),
                          {
                              maxDepth: configuration.getTrackedFieldDepthOnCacheMiss(),
                              onlyFetchLeafNodeId: configuration.getTrackedFieldLeafNodeIdOnly(),
                          },
                          config.optionalFields
                      ),
                  },
              });

    return luvio
        .dispatchResourceRequest<RecordDefaultsTemplateCloneRepresentation>(request, override)
        .then(
            (response) => {
                const { body } = response;
                const key = templateKeyBuilderFromType(body);

                const responseRecordTypeId = body.record.recordTypeId;
                const objectApiName = body.record.apiName;
                // publish metadata for recordTypeId
                saveDefaultRecordTypeId(context, body.objectInfos[objectApiName]);

                const optionalFieldsTrie = convertFieldsToTrie(
                    resourceParams.queryParams.optionalFields
                );
                luvio.storeIngest<RecordDefaultsTemplateCloneRepresentation>(
                    key,
                    resourceCreateFieldsIngest({
                        fields: BLANK_RECORD_FIELDS_TRIE,
                        optionalFields: optionalFieldsTrie,
                        trackedFields: optionalFieldsTrie,
                        serverRequestCount: 1,
                    }),
                    body
                );

                luvio.storeBroadcast();
                const snapshot = buildCachedSnapshot(luvio, context, {
                    ...config,
                    recordTypeId: responseRecordTypeId as string,
                });

                if (process.env.NODE_ENV !== 'production') {
                    if (snapshot.state !== 'Fulfilled') {
                        throw new Error(
                            'Invalid network response. Expected network response to result in Fulfilled snapshot'
                        );
                    }
                }

                return snapshot as FulfilledSnapshot<RecordDefaultsTemplateCloneRepresentation, {}>;
            },
            (response: FetchResponse<unknown>) => {
                const key = templateKeyBuilder({
                    cloneSourceId: config.recordId,
                    recordTypeId: config.recordTypeId || null,
                });
                const errorSnapshot = luvio.errorSnapshot(response, {
                    config,
                    resolve: () =>
                        buildNetworkSnapshot(luvio, context, config, snapshotRefreshOptions),
                });
                luvio.storeIngestError(
                    key,
                    errorSnapshot,
                    RECORD_TEMPLATE_CLONE_ERROR_STORE_METADATA_PARAMS
                );
                return errorSnapshot;
            }
        );
};

const buildCachedSnapshot: (
    luvio: Luvio,
    context: AdapterContext,
    config: GetRecordTemplateCloneConfig
) => ReturnType<typeof generatedBuildCachedSnapshot> = (
    luvio: Luvio,
    context: AdapterContext,
    config: GetRecordTemplateCloneConfig
): Snapshot<RecordDefaultsTemplateCloneRepresentation, any> => {
    const resourceParams = createResourceParams(config);
    const key = templateKeyBuilder({
        cloneSourceId: config.recordId,
        recordTypeId: config.recordTypeId || null,
    });
    const selector: Selector = {
        recordId: key,
        node: select(luvio, resourceParams),
        variables: {},
    };
    return luvio.storeLookup<RecordDefaultsTemplateCloneRepresentation>(selector, {
        config,
        resolve: () => buildNetworkSnapshot(luvio, context, config, snapshotRefreshOptions),
    });
};

type BuildSnapshotContext = {
    adapterContext: AdapterContext;
    config: GetRecordTemplateCloneConfig;
    luvio: Luvio;
    recordTypeId: string | undefined;
};

function buildNetworkSnapshotCachePolicy(
    context: BuildSnapshotContext,
    requestContext: CoercedAdapterRequestContext
): Promise<Snapshot<RecordDefaultsTemplateCloneRepresentation, any>> {
    const { config, adapterContext, luvio } = context;
    let override = undefined;
    const { networkPriority } = requestContext;
    if (networkPriority !== 'normal') {
        override = {
            priority: networkPriority,
        };
    }
    return buildNetworkSnapshot(luvio, adapterContext, config, override);
}

function buildCachedSnapshotCachePolicy(
    context: BuildSnapshotContext,
    storeLookup: StoreLookup<RecordDefaultsTemplateCloneRepresentation>
): Snapshot<RecordDefaultsTemplateCloneRepresentation, any> {
    const { adapterContext, config, luvio, recordTypeId } = context;

    const updatedConfig = {
        ...config,
        recordTypeId,
    };

    const resourceParams = createResourceParams(updatedConfig);
    const key = templateKeyBuilder({
        cloneSourceId: updatedConfig.recordId,
        recordTypeId: updatedConfig.recordTypeId || null,
    });
    const selector: Selector = {
        recordId: key,
        node: select(luvio, resourceParams),
        variables: {},
    };
    return storeLookup(selector, {
        config,
        resolve: () =>
            buildNetworkSnapshot(luvio, adapterContext, updatedConfig, snapshotRefreshOptions),
    });
}

export const factory: AdapterFactory<
    GetRecordTemplateCloneConfig,
    RecordDefaultsTemplateCloneRepresentation
> = (luvio: Luvio) =>
    luvio.withContext(function getRecordTemplateClone_ContextWrapper(
        untrustedConfig: unknown,
        adapterContext: AdapterContext,
        requestContext?: AdapterRequestContext
    ) {
        const config = validateAdapterConfig(
            untrustedConfig,
            getRecordTemplateClone_ConfigPropertyNames
        );

        // Invalid or incomplete config
        if (config === null) {
            return null;
        }

        const recordTypeId = getRecordTypeId(config, adapterContext);

        return luvio.applyCachePolicy(
            requestContext || {},
            {
                luvio,
                config,
                recordTypeId,
                adapterContext,
            },
            buildCachedSnapshotCachePolicy,
            buildNetworkSnapshotCachePolicy
        );
    });
