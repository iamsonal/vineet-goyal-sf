import {
    AdapterFactory,
    Luvio,
    Snapshot,
    FulfilledSnapshot,
    ResourceRequestOverride,
    Selector,
    FetchResponse,
    AdapterContext,
} from '@luvio/engine';
import {
    validateAdapterConfig,
    getRecordTemplateClone_ConfigPropertyNames,
    createResourceParams,
    buildInMemorySnapshot as generatedBuildInMemorySnapshot,
    buildNetworkSnapshot as generatedBuildNetworkSnapshot,
    GetRecordTemplateCloneConfig,
} from '../../generated/adapters/getRecordTemplateClone';
import { createResourceRequest } from '../../generated/resources/getUiApiRecordDefaultsTemplateCloneByRecordId';
import { select } from '../../raml-artifacts/resources/getUiApiRecordDefaultsTemplateCloneByRecordId/select';
import {
    RecordDefaultsTemplateCloneRepresentation,
    TTL,
    ingest as recordDefaultsTemplateCloneRepresentationIngest,
} from '../../generated/types/RecordDefaultsTemplateCloneRepresentation';
import {
    RecordTemplateCloneRepresentationNormalized,
    RecordTemplateCloneRepresentation,
} from '../../generated/types/RecordTemplateCloneRepresentation';
import { ObjectInfoRepresentation } from '../../generated/types/ObjectInfoRepresentation';
import { markMissingOptionalFields } from '../../util/records';
import { getTrackedFields } from '../../util/recordTemplate';
import { snapshotRefreshOptions } from '../../generated/adapters/adapter-utils';
import {
    keyBuilder as templateKeyBuilder,
    keyBuilderFromType as templateKeyBuilderFromType,
} from './CloneTemplateRepresentationKey';
import { keyBuilder as templateRecordKeyBuilder } from './CloneRecordTemplateRepresentationKey';

const DEFAULT_RECORD_TYPE_ID_KEY = 'defaultRecordTypeId';

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

    const request =
        recordTypeId === undefined
            ? resourceRequest
            : createResourceRequest({
                  ...resourceParams,
                  queryParams: {
                      ...resourceRequest.queryParams,
                      optionalFields: getTrackedFields(
                          luvio,
                          templateRecordKeyBuilder({
                              cloneSourceId: recordId,
                              recordTypeId: recordTypeId,
                          }),
                          config.optionalFields
                      ),
                  },
              });

    return luvio
        .dispatchResourceRequest<RecordDefaultsTemplateCloneRepresentation>(request, override)
        .then(
            response => {
                const { body } = response;
                const key = templateKeyBuilderFromType(body);

                const responseRecordTypeId = body.record.recordTypeId;
                const objectApiName = body.record.apiName;

                // publish metadata for recordTypeId
                saveDefaultRecordTypeId(context, body.objectInfos[objectApiName]);

                luvio.storeIngest<RecordDefaultsTemplateCloneRepresentation>(
                    key,
                    recordDefaultsTemplateCloneRepresentationIngest,
                    body
                );

                // mark missing optionalFields
                const templateRecordKey = templateRecordKeyBuilder({
                    cloneSourceId: resourceParams.urlParams.recordId,
                    recordTypeId: responseRecordTypeId,
                });
                const recordNode = luvio.getNode<
                    RecordTemplateCloneRepresentationNormalized,
                    RecordTemplateCloneRepresentation
                >(templateRecordKey);
                const allTrackedFields = getTrackedFields(
                    luvio,
                    templateRecordKey,
                    resourceParams.queryParams.optionalFields
                );
                markMissingOptionalFields(recordNode, allTrackedFields);

                luvio.storeBroadcast();
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

                return snapshot as FulfilledSnapshot<RecordDefaultsTemplateCloneRepresentation, {}>;
            },
            (response: FetchResponse<unknown>) => {
                const key = templateKeyBuilder({
                    cloneSourceId: config.recordId,
                    recordTypeId: config.recordTypeId || null,
                });
                luvio.storeIngestFetchResponse(key, response, TTL);
                return luvio.errorSnapshot(response, {
                    config,
                    resolve: () =>
                        buildNetworkSnapshot(luvio, context, config, snapshotRefreshOptions),
                });
            }
        );
};

const buildInMemorySnapshot: (
    luvio: Luvio,
    context: AdapterContext,
    config: GetRecordTemplateCloneConfig
) => ReturnType<typeof generatedBuildInMemorySnapshot> = (
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

export const factory: AdapterFactory<
    GetRecordTemplateCloneConfig,
    RecordDefaultsTemplateCloneRepresentation
> = (luvio: Luvio) =>
    luvio.withContext(function getRecordTemplateClone_ContextWrapper(
        untrustedConfig: unknown,
        context: AdapterContext
    ) {
        const config = validateAdapterConfig(
            untrustedConfig,
            getRecordTemplateClone_ConfigPropertyNames
        );

        // Invalid or incomplete config
        if (config === null) {
            return null;
        }

        const recordTypeId = getRecordTypeId(config, context);

        const cacheSnapshot = buildInMemorySnapshot(luvio, context, {
            ...config,
            recordTypeId,
        });

        // Cache Hit
        if (luvio.snapshotDataAvailable(cacheSnapshot) === true) {
            return cacheSnapshot;
        }

        return buildNetworkSnapshot(luvio, context, config);
    });
