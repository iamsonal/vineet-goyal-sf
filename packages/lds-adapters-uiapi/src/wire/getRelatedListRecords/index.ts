import { Snapshot, AdapterFactory, LDS, FetchResponse, SnapshotRefresh } from '@ldsjs/engine';
import {
    GetRelatedListRecordsConfig,
    validateAdapterConfig,
    getRelatedListRecords_ConfigPropertyNames as relatedListRecordsConfigProperties,
} from '../../generated/adapters/getRelatedListRecords';
import getUiApiRelatedListRecordsByParentRecordIdAndRelatedListId from '../../generated/resources/getUiApiRelatedListRecordsByParentRecordIdAndRelatedListId';
import {
    RelatedListRecordCollectionRepresentation,
    keyBuilder as RelatedListRecordCollectionRepresentation_keyBuilder,
} from '../../generated/types/RelatedListRecordCollectionRepresentation';
import { buildRelatedListRecordCollectionSelector } from './selectors';
import { isUnfulfilledSnapshot } from '../../util/snapshot';

function buildRefreshSnapshot(
    lds: LDS,
    config: GetRelatedListRecordsConfig
): SnapshotRefresh<RelatedListRecordCollectionRepresentation> {
    return {
        config,
        resolve: () => getRelatedListRecordsNetwork(config, lds, buildCacheKeyFromConfig(config)),
    };
}

export const factory: AdapterFactory<
    GetRelatedListRecordsConfig,
    RelatedListRecordCollectionRepresentation
> = (lds: LDS) =>
    function getRelatedListRecords(untrustedConfig: unknown) {
        const config = validateAdapterConfig(untrustedConfig, relatedListRecordsConfigProperties);

        if (config === null) {
            return null;
        }

        const cacheKey = buildCacheKeyFromConfig(config);
        const recordCollectionSelector = buildRelatedListRecordCollectionSelector(cacheKey, config);

        const lookupResult = lds.storeLookup<RelatedListRecordCollectionRepresentation>(
            recordCollectionSelector,
            buildRefreshSnapshot(lds, config)
        );

        if (lds.snapshotDataAvailable(lookupResult)) {
            // cache hit :partyparrot:
            return lookupResult;
        }

        // Cache miss, go fetch data
        return getRelatedListRecordsNetwork(config, lds, cacheKey);
    };

function getRelatedListRecordsNetwork(
    config: GetRelatedListRecordsConfig,
    lds: LDS,
    cacheKey: string
): Promise<Snapshot<RelatedListRecordCollectionRepresentation>> {
    const { fields, optionalFields, sortBy, pageToken, pageSize } = config;
    const queryParams = {
        fields,
        optionalFields,
        sortBy,
        pageToken,
        pageSize,
    };

    // TODO W-6673136 Pagination for related list records at-wire

    const request = getUiApiRelatedListRecordsByParentRecordIdAndRelatedListId({
        urlParams: {
            parentRecordId: config.parentRecordId,
            relatedListId: config.relatedListId,
        },
        queryParams,
    });

    return lds.dispatchResourceRequest<RelatedListRecordCollectionRepresentation>(request).then(
        resp => {
            const { body } = resp;
            // We need to build the selector before we ingest because we need the record fields
            const listRecordCollectionSelector = buildRelatedListRecordCollectionSelector(
                cacheKey,
                config,
                body
            );

            lds.storeIngest(cacheKey, request, body);
            lds.storeBroadcast();

            const lookupResult = lds.storeLookup<RelatedListRecordCollectionRepresentation>(
                listRecordCollectionSelector,
                buildRefreshSnapshot(lds, config)
            );

            if (isUnfulfilledSnapshot(lookupResult)) {
                throw new Error(
                    `${Object.keys(lookupResult.missingPaths).join(
                        ', '
                    )} missing immediately after get-related-list-records request`
                );
            }
            return lookupResult;
        },
        (err: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(cacheKey, err);
            lds.storeBroadcast();
            return lds.errorSnapshot(err, buildRefreshSnapshot(lds, config));
        }
    );
}

function buildCacheKeyFromConfig(config: GetRelatedListRecordsConfig) {
    return RelatedListRecordCollectionRepresentation_keyBuilder({
        sortBy: config.sortBy || [],
        parentRecordId: config.parentRecordId,
        relatedListId: config.relatedListId,
    });
}
