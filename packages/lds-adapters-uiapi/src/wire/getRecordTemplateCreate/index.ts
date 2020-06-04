import {
    AdapterFactory,
    LDS,
    Snapshot,
    FulfilledSnapshot,
    ResourceRequestOverride,
    Selector,
    FetchResponse,
} from '@ldsjs/engine';
import {
    validateAdapterConfig,
    getRecordTemplateCreate_ConfigPropertyNames,
    createResourceParams,
    buildInMemorySnapshot as generatedBuildInMemorySnapshot,
    buildNetworkSnapshot as generatedBuildNetworkSnapshot,
    GetRecordTemplateCreateConfig,
} from '../../generated/adapters/getRecordTemplateCreate';
import {
    createResourceRequest,
    keyBuilder,
    select,
    ingestError,
} from '../../generated/resources/getUiApiRecordDefaultsTemplateCreateByObjectApiName';
import {
    CreateTemplateRepresentation,
    keyBuilderFromType,
} from '../../generated/types/CreateTemplateRepresentation';
import {
    keyBuilder as recordTemplateKeyBuilder,
    CreateRecordTemplateRepresentationNormalized,
    CreateRecordTemplateRepresentation,
} from '../../generated/types/CreateRecordTemplateRepresentation';
import { ObjectInfoRepresentation } from '../../generated/types/ObjectInfoRepresentation';
import { markMissingOptionalFields } from '../../util/records';
import { getTrackedFields } from '../../util/recordTemplate';
import { isFulfilledSnapshot } from '../../util/snapshot';
import { keyPrefix, snapshotRefreshOptions } from '../../generated/adapters/adapter-utils';

const METADATA_PREFIX = 'METADATA::';

interface GetRecordTemplateCreateMetadata {
    recordTypeId: string | null;
}

function buildMetadataKey(objectApiName: string) {
    return `${METADATA_PREFIX}${keyPrefix}CreateTemplateRepresentation::${objectApiName}`;
}

function getMetadata(lds: LDS, objectApiName: string) {
    const metadataKey = buildMetadataKey(objectApiName);
    return lds.storeLookup<GetRecordTemplateCreateMetadata>({
        recordId: metadataKey,
        node: {
            kind: 'Fragment',
            private: [],
            selections: [
                {
                    name: 'recordTypeId',
                    kind: 'Scalar',
                },
            ],
        },
        variables: {},
    });
}

function saveDefaultRecordTypeId(
    lds: LDS,
    objectApiName: string,
    objectInfo: ObjectInfoRepresentation
) {
    const metadataKey = buildMetadataKey(objectApiName);
    lds.storePublish<GetRecordTemplateCreateMetadata>(metadataKey, {
        recordTypeId: objectInfo.defaultRecordTypeId,
    });
}

function getRecordTypeId(
    lds: LDS,
    adapterConfig: GetRecordTemplateCreateConfig
): string | undefined {
    const config = createResourceParams(adapterConfig);
    const { recordTypeId } = config.queryParams;
    if (recordTypeId !== undefined && recordTypeId !== null) {
        return recordTypeId;
    }

    const metadataSnapshot = getMetadata(lds, config.urlParams.objectApiName);

    if (isFulfilledSnapshot(metadataSnapshot)) {
        const { recordTypeId } = metadataSnapshot.data;
        if (recordTypeId === null) {
            return undefined;
        }
        return recordTypeId;
    }

    return undefined;
}

const buildNetworkSnapshot: typeof generatedBuildNetworkSnapshot = (
    lds: LDS,
    config: GetRecordTemplateCreateConfig,
    override?: ResourceRequestOverride
) => {
    const resourceParams = createResourceParams(config);
    const recordTypeId = getRecordTypeId(lds, config);
    const { objectApiName } = config;
    const resourceRequest = createResourceRequest(resourceParams);

    const request =
        recordTypeId === undefined
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

    return lds.dispatchResourceRequest<CreateTemplateRepresentation>(request, override).then(
        response => {
            const { body } = response;
            const key = keyBuilderFromType(body);

            const responseRecordTypeId = body.record.recordTypeId;

            // publish metadata for recordTypeId
            saveDefaultRecordTypeId(lds, objectApiName, body.objectInfos[objectApiName]);

            lds.storeIngest<CreateTemplateRepresentation>(key, request, body);

            // mark missing optionalFields
            const templateRecordKey = recordTemplateKeyBuilder({
                apiName: resourceParams.urlParams.objectApiName,
                recordTypeId: responseRecordTypeId,
            });
            const recordNode = lds.getNode<
                CreateRecordTemplateRepresentationNormalized,
                CreateRecordTemplateRepresentation
            >(templateRecordKey);
            const allTrackedFields = getTrackedFields(
                lds,
                templateRecordKey,
                resourceParams.queryParams.optionalFields
            );
            markMissingOptionalFields(recordNode, allTrackedFields);

            lds.storeBroadcast();
            const snapshot = buildInMemorySnapshot(lds, {
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

            return snapshot as FulfilledSnapshot<CreateTemplateRepresentation, {}>;
        },
        (response: FetchResponse<unknown>) => {
            const snapshot = ingestError(lds, resourceParams, response, {
                config,
                resolve: () => buildNetworkSnapshot(lds, config, snapshotRefreshOptions),
            });
            lds.storeBroadcast();
            return snapshot;
        }
    );
};

export const buildInMemorySnapshot: typeof generatedBuildInMemorySnapshot = (
    lds: LDS,
    config: GetRecordTemplateCreateConfig
): Snapshot<CreateTemplateRepresentation, any> => {
    const resourceParams = createResourceParams(config);
    const selector: Selector = {
        recordId: keyBuilder(resourceParams),
        node: select(lds, resourceParams),
        variables: {},
    };
    return lds.storeLookup<CreateTemplateRepresentation>(selector, {
        config,
        resolve: () => buildNetworkSnapshot(lds, config, snapshotRefreshOptions),
    });
};

export const getRecordTemplateCreateAdapterFactory: AdapterFactory<
    GetRecordTemplateCreateConfig,
    CreateTemplateRepresentation
> = (lds: LDS) =>
    function getRecordDefaultsTemplateForCreate(
        untrustedConfig: unknown
    ):
        | Promise<Snapshot<CreateTemplateRepresentation, any>>
        | Snapshot<CreateTemplateRepresentation, any>
        | null {
        const config = validateAdapterConfig(
            untrustedConfig,
            getRecordTemplateCreate_ConfigPropertyNames
        );

        // Invalid or incomplete config
        if (config === null) {
            return null;
        }

        const recordTypeId = getRecordTypeId(lds, config);

        const cacheSnapshot = buildInMemorySnapshot(lds, {
            ...config,
            recordTypeId,
        });

        // Cache Hit
        if (lds.snapshotDataAvailable(cacheSnapshot) === true) {
            return cacheSnapshot;
        }

        return buildNetworkSnapshot(lds, config);
    };
