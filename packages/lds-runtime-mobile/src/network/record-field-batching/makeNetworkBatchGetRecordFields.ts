import { NetworkAdapter, ResourceRequest } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import {
    AggregateResponse,
    buildCompositeRequestByFields,
    createAggregateUiRequest,
    mergeAggregateUiResponse,
    mergeRecordFields,
    createAggregateBatchRequestInfo,
} from './utils';

const RECORD_ENDPOINT_REGEX = /^\/ui-api\/records\/?(([a-zA-Z0-9]+))?$/;
const referenceId = 'LDS_Records_AggregateUi';

export function makeNetworkBatchGetRecordFields(networkAdapter: NetworkAdapter): NetworkAdapter {
    return (resourceRequest: ResourceRequest) => {
        const batchRequestInfo = createAggregateBatchRequestInfo(
            resourceRequest,
            RECORD_ENDPOINT_REGEX
        );
        if (batchRequestInfo === undefined) {
            return networkAdapter(resourceRequest);
        }
        const { fieldsArray, optionalFieldsArray, fieldsString, optionalFieldsString } =
            batchRequestInfo;
        const compositeRequest = createAggregateUiRequest(
            resourceRequest,
            buildCompositeRequestByFields(referenceId, resourceRequest, {
                fieldsArray,
                optionalFieldsArray,
                fieldsLength: fieldsString.length,
                optionalFieldsLength: optionalFieldsString.length,
            })
        );

        return networkAdapter(compositeRequest).then((response) => {
            return mergeAggregateUiResponse(
                response as AggregateResponse<RecordRepresentation>,
                mergeRecordFields
            );
        });
    };
}
