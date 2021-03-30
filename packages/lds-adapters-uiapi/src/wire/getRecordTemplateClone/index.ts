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
} from '../../generated/types/RecordDefaultsTemplateCloneRepresentation';
import { ObjectInfoRepresentation } from '../../generated/types/ObjectInfoRepresentation';
import { keyBuilder as templateRecordKeyBuilder } from '../../generated/types/RecordTemplateCloneRepresentation';
import {
    BLANK_RECORD_FIELDS_TRIE,
    convertFieldsToTrie,
    getTrackedFields,
} from '../../util/records';
import { snapshotRefreshOptions } from '../../generated/adapters/adapter-utils';
import {
    keyBuilder as templateKeyBuilder,
    keyBuilderFromType as templateKeyBuilderFromType,
} from '../../generated/types/RecordDefaultsTemplateCloneRepresentation';
import { createFieldsIngestSuccess as resourceCreateFieldsIngest } from '../../generated/fields/resources/getUiApiRecordDefaultsTemplateCloneByRecordId';

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

                const optionalFieldsTrie = convertFieldsToTrie(
                    resourceParams.queryParams.optionalFields
                );
                luvio.storeIngest<RecordDefaultsTemplateCloneRepresentation>(
                    key,
                    resourceCreateFieldsIngest({
                        fields: BLANK_RECORD_FIELDS_TRIE,
                        optionalFields: optionalFieldsTrie,
                        trackedFields: optionalFieldsTrie,
                    }),
                    body
                );

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
        if (luvio.snapshotAvailable(cacheSnapshot) === true) {
            return cacheSnapshot;
        }

        return buildNetworkSnapshot(luvio, context, config);
    });
