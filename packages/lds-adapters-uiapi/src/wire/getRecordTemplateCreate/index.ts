import {
    AdapterFactory,
    LDS,
    Snapshot,
    FulfilledSnapshot,
    ResourceRequestOverride,
    Selector,
    FetchResponse,
    ResourceResponse,
    ResourceRequest,
    UnfulfilledSnapshot,
    AdapterContext,
} from '@ldsjs/engine';
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
    select,
    ingestError,
    ResourceRequestConfig,
} from '../../generated/resources/getUiApiRecordDefaultsTemplateCreateByObjectApiName';
import {
    RecordDefaultsTemplateCreateRepresentation,
    keyBuilderFromType,
    ingest as createTemplateRepresentationIngest,
} from '../../generated/types/RecordDefaultsTemplateCreateRepresentation';
import {
    keyBuilder as recordTemplateKeyBuilder,
    RecordTemplateCreateRepresentationNormalized,
    RecordTemplateCreateRepresentation,
} from '../../generated/types/RecordTemplateCreateRepresentation';
import { markMissingOptionalFields } from '../../util/records';
import { getTrackedFields } from '../../util/recordTemplate';
import { snapshotRefreshOptions } from '../../generated/adapters/adapter-utils';

import { isUnfulfilledSnapshot } from '../../util/snapshot';

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

function prepareRequest(lds: LDS, context: AdapterContext, config: GetRecordTemplateCreateConfig) {
    const resourceParams = createResourceParams(config);
    const recordTypeId = getRecordTypeId(context, config);
    const { objectApiName } = config;
    const resourceRequest = createResourceRequest(resourceParams);

    return recordTypeId === undefined
        ? resourceRequest
        : createResourceRequest({
              ...resourceParams,
              queryParams: {
                  ...resourceRequest.queryParams,
                  optionalFields: getTrackedFields(
                      lds,
                      recordTemplateKeyBuilder({
                          apiName: objectApiName,
                          recordTypeId: recordTypeId,
                      }),
                      config.optionalFields
                  ),
              },
          });
}

function onResourceResponseSuccess(
    lds: LDS,
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

    lds.storeIngest<RecordDefaultsTemplateCreateRepresentation>(
        key,
        createTemplateRepresentationIngest,
        body
    );

    // mark missing optionalFields
    const templateRecordKey = recordTemplateKeyBuilder({
        apiName: objectApiName,
        recordTypeId: responseRecordTypeId,
    });
    const recordNode = lds.getNode<
        RecordTemplateCreateRepresentationNormalized,
        RecordTemplateCreateRepresentation
    >(templateRecordKey);
    const allTrackedFields = getTrackedFields(lds, templateRecordKey, optionalFields);
    markMissingOptionalFields(recordNode, allTrackedFields);

    lds.storeBroadcast();
    const snapshot = buildInMemorySnapshot(lds, context, {
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

    return snapshot as FulfilledSnapshot<RecordDefaultsTemplateCreateRepresentation, {}>;
}

function onResourceResponseError(
    lds: LDS,
    context: AdapterContext,
    config: GetRecordTemplateCreateConfig,
    resourceParams: ResourceRequestConfig,
    error: FetchResponse<unknown>
) {
    const snapshot = ingestError(lds, resourceParams, error, {
        config,
        resolve: () => buildNetworkSnapshot(lds, context, config, snapshotRefreshOptions),
    });
    lds.storeBroadcast();
    return snapshot;
}

function buildNetworkSnapshot(
    lds: LDS,
    context: AdapterContext,
    config: GetRecordTemplateCreateConfig,
    override?: ResourceRequestOverride
): ReturnType<typeof generatedBuildNetworkSnapshot> {
    const resourceParams = createResourceParams(config);
    const request = prepareRequest(lds, context, config);

    return lds
        .dispatchResourceRequest<RecordDefaultsTemplateCreateRepresentation>(request, override)
        .then(
            response => {
                return onResourceResponseSuccess(
                    lds,
                    context,
                    config,
                    request,
                    response,
                    resourceParams
                );
            },
            (response: FetchResponse<unknown>) => {
                return onResourceResponseError(lds, context, config, resourceParams, response);
            }
        );
}

function resolveUnfulfilledSnapshot(
    lds: LDS,
    context: AdapterContext,
    config: GetRecordTemplateCreateConfig,
    snapshot: UnfulfilledSnapshot<RecordDefaultsTemplateCreateRepresentation, unknown>
): Promise<Snapshot<RecordDefaultsTemplateCreateRepresentation>> {
    const resourceParams = createResourceParams(config);
    const request = prepareRequest(lds, context, config);

    return lds.resolveUnfulfilledSnapshot(request, snapshot).then(
        response => {
            return onResourceResponseSuccess(
                lds,
                context,
                config,
                request,
                response,
                resourceParams
            );
        },
        (response: FetchResponse<unknown>) => {
            return onResourceResponseError(lds, context, config, resourceParams, response);
        }
    );
}

function buildInMemorySnapshot(
    lds: LDS,
    context: AdapterContext,
    config: GetRecordTemplateCreateConfig
): Snapshot<RecordDefaultsTemplateCreateRepresentation, any> {
    const resourceParams = createResourceParams(config);
    const selector: Selector = {
        recordId: keyBuilder(resourceParams),
        node: select(lds, resourceParams),
        variables: {},
    };
    return lds.storeLookup<RecordDefaultsTemplateCreateRepresentation>(selector, {
        config,
        resolve: () => buildNetworkSnapshot(lds, context, config, snapshotRefreshOptions),
    });
}

export const factory: AdapterFactory<
    GetRecordTemplateCreateConfig,
    RecordDefaultsTemplateCreateRepresentation
> = (lds: LDS) => {
    return lds.withContext(function UiApi__getRecordDefaultsTemplateForCreate(
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

        const cacheSnapshot = buildInMemorySnapshot(lds, context, {
            ...config,
            recordTypeId,
        });

        // Cache Hit
        if (lds.snapshotDataAvailable(cacheSnapshot) === true) {
            return cacheSnapshot;
        }

        if (isUnfulfilledSnapshot(cacheSnapshot)) {
            return resolveUnfulfilledSnapshot(lds, context, config, cacheSnapshot);
        }

        return buildNetworkSnapshot(lds, context, config);
    });
};
