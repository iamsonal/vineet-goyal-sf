import { FetchResponse, NetworkAdapter, ResourceRequest } from '@luvio/engine';
import {
    buildCompositeRequestByFields,
    createAggregateUiRequest,
    mergeAggregateUiResponse,
    createAggregateBatchRequestInfo,
    AggregateResponse,
    mergeBatchRecordsFields,
} from './utils';
import {
    RelatedListRecordCollectionBatchRepresentation,
    RelatedListRecordCollectionRepresentation,
} from '@salesforce/lds-adapters-uiapi';

import { mergeRelatedRecordsFields } from './makeNetworkChunkFieldsGetRelatedListRecords';

const RELATED_LIST_RECORDS_BATCH_ENDPOINT_REGEX =
    /^\/ui-api\/related-list-records\/batch\/?(([a-zA-Z0-9]+))?\//;
const referenceId = 'LDS_Related_List_Records_AggregateUi';

export type RelatedListBatchAggregateResponse =
    AggregateResponse<RelatedListRecordCollectionBatchRepresentation>;
export type RelatedListBatchResponse =
    FetchResponse<RelatedListRecordCollectionBatchRepresentation>;

export function makeNetworkChunkFieldsGetRelatedListRecordsBatch(
    networkAdapter: NetworkAdapter
): NetworkAdapter {
    return (resourceRequest: ResourceRequest) => {
        const batchRequestInfo = createAggregateBatchRequestInfo(
            resourceRequest,
            RELATED_LIST_RECORDS_BATCH_ENDPOINT_REGEX
        );
        if (batchRequestInfo === undefined) {
            return networkAdapter(resourceRequest);
        }

        const compositeRequest = buildCompositeRequestByFields(
            referenceId,
            resourceRequest,
            batchRequestInfo
        );
        const aggregateRequest = createAggregateUiRequest(resourceRequest, compositeRequest);

        return networkAdapter(aggregateRequest).then((response) => {
            return mergeAggregateUiResponse(
                response as RelatedListBatchAggregateResponse,
                (first, second) => {
                    return mergeBatchRecordsFields(first, second, (a, b) => {
                        return mergeRelatedRecordsFields(
                            a as RelatedListRecordCollectionRepresentation,
                            b as RelatedListRecordCollectionRepresentation
                        );
                    }) as RelatedListRecordCollectionBatchRepresentation;
                }
            );
        });
    };
}
