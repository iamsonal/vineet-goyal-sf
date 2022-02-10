import type { NetworkAdapter, ResourceRequest, FetchResponse } from '@luvio/engine';
import type { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import type { AggregateResponse, UiApiErrorResponse } from './utils';
import {
    buildCompositeRequestByFields,
    createAggregateUiRequest,
    mergeAggregateUiResponse,
    mergeRecordFields,
    createAggregateBatchRequestInfo,
} from './utils';
import { ArrayIsArray } from '../../utils/language';

const RECORD_ENDPOINT_REGEX = /^\/ui-api\/records\/?(([a-zA-Z0-9]+))?$/;
const referenceId = 'LDS_Records_AggregateUi';

export type GetRecordResult = RecordRepresentation | UiApiErrorResponse;
export type GetRecordAggregateResponse = AggregateResponse<GetRecordResult>;
export type GetRecordResponse = FetchResponse<GetRecordResult>;

/**
 * Export to facilitate unit tests
 * Merge the second getRecord result into the first one.
 * If any is error response, merged result is error response.
 * If both are sucesses, due to they are from same records,
 * fields sub node will be merged recursively
 */
export function mergeGetRecordResult(
    first: GetRecordResult,
    second: GetRecordResult
): GetRecordResult {
    // return the error if first is error.
    if (ArrayIsArray(first) && !ArrayIsArray(second)) return first;

    // return the error if second is error.
    if (!ArrayIsArray(first) && ArrayIsArray(second)) return second;

    // concat the error array if both are error
    if (ArrayIsArray(first) && ArrayIsArray(second)) {
        return [...first, ...second];
    }

    mergeRecordFields(first as RecordRepresentation, second as RecordRepresentation);
    return first;
}

export function makeNetworkChunkFieldsGetRecord(networkAdapter: NetworkAdapter): NetworkAdapter {
    return (resourceRequest: ResourceRequest) => {
        const batchRequestInfo = createAggregateBatchRequestInfo(
            resourceRequest,
            RECORD_ENDPOINT_REGEX
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
                response as GetRecordAggregateResponse,
                mergeGetRecordResult
            );
        });
    };
}
