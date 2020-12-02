import {
    AdapterFactory,
    Luvio,
    Snapshot,
    FulfilledSnapshot,
    ResourceRequestOverride,
    Selector,
    FetchResponse,
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
    return `${METADATA_PREFIX}${keyPrefix}RecordDefaultsTemplateCloneRepresentation::${recordId}`;
}

function getMetadata(luvio: Luvio, recordId: string) {
    const metadataKey = buildMetadataKey(recordId);
    return luvio.storeLookup<GetRecordTemplateCreateMetadata>({
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
    luvio: Luvio,
    recordId: string,
    objectInfo: ObjectInfoRepresentation
) {
    const metadataKey = buildMetadataKey(recordId);
    luvio.storePublish<GetRecordTemplateCreateMetadata>(metadataKey, {
        recordTypeId: objectInfo.defaultRecordTypeId,
    });
}

function getRecordTypeId(
    luvio: Luvio,
    adapterConfig: GetRecordTemplateCloneConfig
): string | undefined {
    const config = createResourceParams(adapterConfig);
    const { recordTypeId } = config.queryParams;
    if (recordTypeId !== undefined && recordTypeId !== null) {
        return recordTypeId;
    }

    const metadataSnapshot = getMetadata(luvio, config.urlParams.recordId);

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
    luvio: Luvio,
    config: GetRecordTemplateCloneConfig,
    override?: ResourceRequestOverride
) => {
    const resourceParams = createResourceParams(config);
    const recordTypeId = getRecordTypeId(luvio, config);
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
                saveDefaultRecordTypeId(luvio, recordId, body.objectInfos[objectApiName]);

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
                const snapshot = buildInMemorySnapshot(luvio, {
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
                    resolve: () => buildNetworkSnapshot(luvio, config, snapshotRefreshOptions),
                });
            }
        );
};

export const buildInMemorySnapshot: typeof generatedBuildInMemorySnapshot = (
    luvio: Luvio,
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
        resolve: () => buildNetworkSnapshot(luvio, config, snapshotRefreshOptions),
    });
};

export const factory: AdapterFactory<
    GetRecordTemplateCloneConfig,
    RecordDefaultsTemplateCloneRepresentation
> = (luvio: Luvio) =>
    function getRecordDefaultsTemplateForCreate(
        untrustedConfig: unknown
    ):
        | Promise<Snapshot<RecordDefaultsTemplateCloneRepresentation, any>>
        | Snapshot<RecordDefaultsTemplateCloneRepresentation, any>
        | null {
        const config = validateAdapterConfig(
            untrustedConfig,
            getRecordTemplateClone_ConfigPropertyNames
        );

        // Invalid or incomplete config
        if (config === null) {
            return null;
        }

        const recordTypeId = getRecordTypeId(luvio, config);

        const cacheSnapshot = buildInMemorySnapshot(luvio, {
            ...config,
            recordTypeId,
        });

        // Cache Hit
        if (luvio.snapshotDataAvailable(cacheSnapshot) === true) {
            return cacheSnapshot;
        }

        return buildNetworkSnapshot(luvio, config);
    };
