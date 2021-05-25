import { FetchResponse, NetworkAdapter, ResourceRequest } from '@luvio/engine';
import { BatchRepresentation, RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import {
    AggregateResponse,
    buildCompositeRequestByFields,
    createAggregateUiRequest,
    mergeAggregateUiResponse,
    mergeRecordFields,
    createAggregateBatchRequestInfo,
    mergeBatchRecordsFields,
} from './utils';

export const RECORDS_BATCH_ENDPOINT_REGEX = /^\/ui-api\/records\/batch\/?(([a-zA-Z0-9|,]+))?$/;
const referenceId = 'LDS_Records_Batch_AggregateUi';

export type GetRecordsBatchAggregateResponse = AggregateResponse<BatchRepresentation>;
export type GetRecordsBatchResponse = FetchResponse<BatchRepresentation>;

export function makeNetworkChunkFieldsGetRecordsBatch(
    networkAdapter: NetworkAdapter
): NetworkAdapter {
    return (resourceRequest: ResourceRequest) => {
        const batchRequestInfo = createAggregateBatchRequestInfo(
            resourceRequest,
            RECORDS_BATCH_ENDPOINT_REGEX
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
                response as GetRecordsBatchAggregateResponse,
                (first, second) => {
                    return mergeBatchRecordsFields(first, second, (a, b) => {
                        return mergeRecordFields(
                            a as RecordRepresentation,
                            b as RecordRepresentation
                        );
                    }) as BatchRepresentation;
                }
            );
        });
    };
}
