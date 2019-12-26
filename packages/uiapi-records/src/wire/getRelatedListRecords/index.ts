import { Snapshot, AdapterFactory, LDS, FetchResponse } from '@salesforce-lds/engine';
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
import { isFulfilledSnapshot, isUnfulfilledSnapshot } from '../../util/snapshot';

export const factory: AdapterFactory<
    GetRelatedListRecordsConfig,
    RelatedListRecordCollectionRepresentation
> = (lds: LDS) => {
    return function(untrustedConfig: unknown) {
        const config = validateAdapterConfig(untrustedConfig, relatedListRecordsConfigProperties);
        if (config === null || config.fields === undefined) {
            return null;
        }

        const cacheKey = RelatedListRecordCollectionRepresentation_keyBuilder({
            sortBy: config.sortBy || [],
            parentRecordId: config.parentRecordId,
            relatedListId: config.relatedListId,
        });

        // Right now we have a problem where we cant lookup cached records without a list of fields
        // The uiapi will go fetch the correct fields but requesting with empty
        // fields is always a cache miss. We have filed W-6657626 to revisit this
        if (config.fields !== undefined) {
            const recordCollectionSelector = buildRelatedListRecordCollectionSelector(
                cacheKey,
                config
            );

            const lookupResult = lds.storeLookup<RelatedListRecordCollectionRepresentation>(
                recordCollectionSelector
            );

            if (isFulfilledSnapshot(lookupResult)) {
                // cache hit :partyparrot:
                return lookupResult;
            }
        }

        // Cache miss, go fetch data
        return getRelatedListRecords(config, lds, cacheKey);
    };
};

function getRelatedListRecords(
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
                listRecordCollectionSelector
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
            return lds.errorSnapshot(err);
        }
    );
}
