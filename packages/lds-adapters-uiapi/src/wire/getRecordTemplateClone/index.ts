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
    getRecordTemplateClone_ConfigPropertyNames,
    createResourceParams,
    buildInMemorySnapshot as generatedBuildInMemorySnapshot,
    buildNetworkSnapshot as generatedBuildNetworkSnapshot,
    GetRecordTemplateCloneConfig,
} from '../../generated/adapters/getRecordTemplateClone';
import {
    createResourceRequest,
    select,
} from '../../generated/resources/getUiApiRecordDefaultsTemplateCloneByRecordId';
import {
    CloneTemplateRepresentation,
    TTL,
} from '../../generated/types/CloneTemplateRepresentation';
import {
    CloneRecordTemplateRepresentationNormalized,
    CloneRecordTemplateRepresentation,
} from '../../generated/types/CloneRecordTemplateRepresentation';
import { ObjectInfoRepresentation } from '../../generated/types/ObjectInfoRepresentation';
import { markMissingOptionalFields } from '../../util/records';
import { getTrackedFields } from '../../util/recordTemplate';
import { isFulfilledSnapshot } from '../../util/snapshot';
import { keyPrefix, snapshotRefreshOptions } from '../../generated/adapters/adapter-utils';
import {
    keyBuilder as templateKeyBuilder,
    keyBuilderFromType as templateKeyBuilderFromType,
} from './CloneTemplateRepresentationKey';
import { keyBuilder as templateRecordKeyBuilder } from './CloneRecordTemplateRepresentationKey';

const METADATA_PREFIX = 'METADATA::';

interface GetRecordTemplateCreateMetadata {
    recordTypeId: string | null;
}

function buildMetadataKey(recordId: string) {
    return `${METADATA_PREFIX}${keyPrefix}CloneTemplateRepresentation::${recordId}`;
}

function getMetadata(lds: LDS, recordId: string) {
    const metadataKey = buildMetadataKey(recordId);
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

function saveDefaultRecordTypeId(lds: LDS, recordId: string, objectInfo: ObjectInfoRepresentation) {
    const metadataKey = buildMetadataKey(recordId);
    lds.storePublish<GetRecordTemplateCreateMetadata>(metadataKey, {
        recordTypeId: objectInfo.defaultRecordTypeId,
    });
}

function getRecordTypeId(
    lds: LDS,
    adapterConfig: GetRecordTemplateCloneConfig
): string | undefined {
    const config = createResourceParams(adapterConfig);
    const { recordTypeId } = config.queryParams;
    if (recordTypeId !== undefined && recordTypeId !== null) {
        return recordTypeId;
    }

    const metadataSnapshot = getMetadata(lds, config.urlParams.recordId);

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
    config: GetRecordTemplateCloneConfig,
    override?: ResourceRequestOverride
) => {
    const resourceParams = createResourceParams(config);
    const recordTypeId = getRecordTypeId(lds, config);
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
                          lds,
                          templateRecordKeyBuilder({
                              cloneSourceId: recordId,
                              recordTypeId: recordTypeId,
                          }),
                          config.optionalFields
                      ),
                  },
              });

    return lds.dispatchResourceRequest<CloneTemplateRepresentation>(request, override).then(
        response => {
            const { body } = response;
            const key = templateKeyBuilderFromType(body);

            const responseRecordTypeId = body.record.recordTypeId;
            const objectApiName = body.record.apiName;

            // publish metadata for recordTypeId
            saveDefaultRecordTypeId(lds, recordId, body.objectInfos[objectApiName]);

            lds.storeIngest<CloneTemplateRepresentation>(key, request.ingest, body);

            // mark missing optionalFields
            const templateRecordKey = templateRecordKeyBuilder({
                cloneSourceId: resourceParams.urlParams.recordId,
                recordTypeId: responseRecordTypeId,
            });
            const recordNode = lds.getNode<
                CloneRecordTemplateRepresentationNormalized,
                CloneRecordTemplateRepresentation
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

            return snapshot as FulfilledSnapshot<CloneTemplateRepresentation, {}>;
        },
        (response: FetchResponse<unknown>) => {
            const key = templateKeyBuilder({
                cloneSourceId: config.recordId,
                recordTypeId: config.recordTypeId || null,
            });
            lds.storeIngestFetchResponse(key, response, TTL);
            return lds.errorSnapshot(response, {
                config,
                resolve: () => buildNetworkSnapshot(lds, config, snapshotRefreshOptions),
            });
        }
    );
};

export const buildInMemorySnapshot: typeof generatedBuildInMemorySnapshot = (
    lds: LDS,
    config: GetRecordTemplateCloneConfig
): Snapshot<CloneTemplateRepresentation, any> => {
    const resourceParams = createResourceParams(config);
    const key = templateKeyBuilder({
        cloneSourceId: config.recordId,
        recordTypeId: config.recordTypeId || null,
    });
    const selector: Selector = {
        recordId: key,
        node: select(lds, resourceParams),
        variables: {},
    };
    return lds.storeLookup<CloneTemplateRepresentation>(selector, {
        config,
        resolve: () => buildNetworkSnapshot(lds, config, snapshotRefreshOptions),
    });
};

export const factory: AdapterFactory<GetRecordTemplateCloneConfig, CloneTemplateRepresentation> = (
    lds: LDS
) =>
    function getRecordDefaultsTemplateForCreate(
        untrustedConfig: unknown
    ):
        | Promise<Snapshot<CloneTemplateRepresentation, any>>
        | Snapshot<CloneTemplateRepresentation, any>
        | null {
        const config = validateAdapterConfig(
            untrustedConfig,
            getRecordTemplateClone_ConfigPropertyNames
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
