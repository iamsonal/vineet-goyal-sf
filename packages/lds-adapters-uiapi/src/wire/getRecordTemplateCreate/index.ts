import {
    AdapterFactory,
    Luvio,
    Snapshot,
    FulfilledSnapshot,
    ResourceRequestOverride,
    Selector,
    FetchResponse,
    ResourceResponse,
    ResourceRequest,
    AdapterContext,
    SnapshotRefresh,
} from '@luvio/engine';
import {
    validateAdapterConfig,
    getRecordTemplateCreate_ConfigPropertyNames,
    createResourceParams,
    buildNetworkSnapshot as generatedBuildNetworkSnapshot,
    GetRecordTemplateCreateConfig,
} from '../../generated/adapters/getRecordTemplateCreate';
import {
    createResourceRequest,
    keyBuilder,
    ingestError,
    ResourceRequestConfig,
} from '../../generated/resources/getUiApiRecordDefaultsTemplateCreateByObjectApiName';
import { adapterFragment } from '../../generated/fields/adapters/getRecordTemplateCreate';
import { RecordDefaultsTemplateCreateRepresentation } from '../../generated/types/RecordDefaultsTemplateCreateRepresentation';
import { keyBuilder as recordTemplateKeyBuilder } from '../../generated/types/RecordTemplateCreateRepresentation';
import {
    BLANK_RECORD_FIELDS_TRIE,
    convertFieldsToTrie,
    getTrackedFields,
} from '../../util/records';
import { snapshotRefreshOptions } from '../../generated/adapters/adapter-utils';

import { keyBuilderFromType } from '../../generated/types/RecordDefaultsTemplateCreateRepresentation';
import { createFieldsIngestSuccess as resourceCreateFieldsIngest } from '../../generated/fields/resources/getUiApiRecordDefaultsTemplateCreateByObjectApiName';
import { configuration } from '../../configuration';

function buildSnapshotRefresh(
    luvio: Luvio,
    context: AdapterContext,
    config: GetRecordTemplateCreateConfig
): SnapshotRefresh<RecordDefaultsTemplateCreateRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(luvio, context, config, snapshotRefreshOptions),
    };
}

function buildRecordTypeIdContextKey(objectApiName: string): string {
    return `DEFAULTS::recordTypeId:${objectApiName}`;
}

function getRecordTypeId(
    context: AdapterContext,
    adapterConfig: GetRecordTemplateCreateConfig
): string | undefined {
    const config = createResourceParams(adapterConfig);
    const { recordTypeId } = config.queryParams;
    if (recordTypeId !== undefined && recordTypeId !== null) {
        return recordTypeId;
    }

    const saved = context.get<string>(buildRecordTypeIdContextKey(config.urlParams.objectApiName));

    if (saved === null || saved === undefined) {
        return undefined;
    }

    return saved;
}

function prepareRequest(
    luvio: Luvio,
    context: AdapterContext,
    config: GetRecordTemplateCreateConfig
) {
    const resourceParams = createResourceParams(config);
    const recordTypeId = getRecordTypeId(context, config);
    const { objectApiName } = config;
    const resourceRequest = createResourceRequest(resourceParams);
    if (recordTypeId === undefined) {
        return resourceRequest;
    }
    const recordTemplateKey = recordTemplateKeyBuilder({
        apiName: objectApiName,
        recordTypeId: recordTypeId,
    });

    return createResourceRequest({
        ...resourceParams,
        queryParams: {
            ...resourceRequest.queryParams,
            optionalFields: getTrackedFields(
                recordTemplateKey,
                luvio.getNode(recordTemplateKey),
                {
                    maxDepth: configuration.getTrackedFieldDepthOnCacheMiss(),
                    onlyFetchLeafNodeId: configuration.getTrackedFieldLeafNodeIdOnly(),
                },
                config.optionalFields
            ),
        },
    });
}

function onResourceResponseSuccess(
    luvio: Luvio,
    context: AdapterContext,
    config: GetRecordTemplateCreateConfig,
    request: ResourceRequest,
    response: ResourceResponse<RecordDefaultsTemplateCreateRepresentation>,
    resourceParams: ResourceRequestConfig
) {
    const {
        urlParams: { objectApiName },
        queryParams: { optionalFields },
    } = resourceParams;
    const { body } = response;
    const key = keyBuilderFromType(body);

    const responseRecordTypeId = body.record.recordTypeId;

    // publish metadata for recordTypeId
    const recordTypeId = body.objectInfos[objectApiName].defaultRecordTypeId;
    context.set(buildRecordTypeIdContextKey(objectApiName), recordTypeId);

    // mark missing optionalFields
    const templateRecordKey = recordTemplateKeyBuilder({
        apiName: objectApiName,
        recordTypeId: responseRecordTypeId,
    });

    const allTrackedFields = getTrackedFields(
        templateRecordKey,
        luvio.getNode(templateRecordKey),
        {
            maxDepth: configuration.getTrackedFieldDepthOnCacheMiss(),
            onlyFetchLeafNodeId: configuration.getTrackedFieldLeafNodeIdOnly(),
        },
        optionalFields
    );
    const allTrackedFieldsTrie = convertFieldsToTrie(allTrackedFields, true);

    const ingest = resourceCreateFieldsIngest({
        fields: BLANK_RECORD_FIELDS_TRIE,
        optionalFields: allTrackedFieldsTrie,
        trackedFields: allTrackedFieldsTrie,
        serverRequestCount: 1,
    });

    luvio.storeIngest<RecordDefaultsTemplateCreateRepresentation>(key, ingest, body);

    const snapshot = buildInMemorySnapshot(luvio, context, {
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

    luvio.storeBroadcast();

    return snapshot as FulfilledSnapshot<RecordDefaultsTemplateCreateRepresentation, {}>;
}

function onResourceResponseError(
    luvio: Luvio,
    context: AdapterContext,
    config: GetRecordTemplateCreateConfig,
    resourceParams: ResourceRequestConfig,
    error: FetchResponse<unknown>
) {
    const snapshot = ingestError(
        luvio,
        resourceParams,
        error,
        buildSnapshotRefresh(luvio, context, config)
    );
    luvio.storeBroadcast();
    return snapshot;
}

function buildNetworkSnapshot(
    luvio: Luvio,
    context: AdapterContext,
    config: GetRecordTemplateCreateConfig,
    override?: ResourceRequestOverride
): ReturnType<typeof generatedBuildNetworkSnapshot> {
    const resourceParams = createResourceParams(config);
    const request = prepareRequest(luvio, context, config);

    return luvio
        .dispatchResourceRequest<RecordDefaultsTemplateCreateRepresentation>(request, override)
        .then(
            (response) => {
                return onResourceResponseSuccess(
                    luvio,
                    context,
                    config,
                    request,
                    response,
                    resourceParams
                );
            },
            (response: FetchResponse<unknown>) => {
                return onResourceResponseError(luvio, context, config, resourceParams, response);
            }
        );
}

function buildInMemorySnapshot(
    luvio: Luvio,
    context: AdapterContext,
    config: GetRecordTemplateCreateConfig
): Snapshot<RecordDefaultsTemplateCreateRepresentation, any> {
    const resourceParams = createResourceParams(config);
    const selector: Selector = {
        recordId: keyBuilder(resourceParams),
        node: adapterFragment(luvio, config),
        variables: {},
    };
    return luvio.storeLookup<RecordDefaultsTemplateCreateRepresentation>(
        selector,
        buildSnapshotRefresh(luvio, context, config)
    );
}

export const factory: AdapterFactory<
    GetRecordTemplateCreateConfig,
    RecordDefaultsTemplateCreateRepresentation
> = (luvio: Luvio) => {
    return luvio.withContext(function UiApi__getRecordDefaultsTemplateForCreate(
        untrustedConfig: unknown,
        context: AdapterContext
    ):
        | Promise<Snapshot<RecordDefaultsTemplateCreateRepresentation, any>>
        | Snapshot<RecordDefaultsTemplateCreateRepresentation, any>
        | null {
        const config = validateAdapterConfig(
            untrustedConfig,
            getRecordTemplateCreate_ConfigPropertyNames
        );

        // Invalid or incomplete config
        if (config === null) {
            return null;
        }

        const recordTypeId = getRecordTypeId(context, config);

        const cacheSnapshot = buildInMemorySnapshot(luvio, context, {
            ...config,
            recordTypeId,
        });

        // Cache Hit
        if (luvio.snapshotAvailable(cacheSnapshot)) {
            return cacheSnapshot;
        }

        return luvio.resolveSnapshot(cacheSnapshot, buildSnapshotRefresh(luvio, context, config));
    });
};
