import { NetworkAdapter, ResourceRequest } from '@luvio/engine';
import {
    AggregateResponse,
    buildCompositeRequestByFields,
    createAggregateUiRequest,
    mergeAggregateUiResponse,
    mergeRecordFields,
    createAggregateBatchRequestInfo,
} from './utils';
import {
    RecordRepresentation,
    RelatedListRecordCollectionRepresentation,
} from '@salesforce/lds-adapters-uiapi';

const RELATED_LIST_RECORDS_ENDPOINT_REGEX =
    /^\/ui-api\/related-list-records\/?(([a-zA-Z0-9]+))?\/?(([a-zA-Z0-9]+))?$/;
const referenceId = 'LDS_Related_List_Records_AggregateUi';

function mergeRelatedRecordsFields(
    first: RelatedListRecordCollectionRepresentation,
    second: RelatedListRecordCollectionRepresentation
): RelatedListRecordCollectionRepresentation {
    const { records: targetRecords } = first;
    const { records: sourceRecords } = second;

    if (
        sourceRecords.length !== targetRecords.length ||
        !recordIdsAllMatch(targetRecords, sourceRecords)
    ) {
        throw new Error('Aggregate UI response is invalid');
    }

    first.fields = first.fields.concat(second.fields);
    first.optionalFields = first.optionalFields.concat(second.optionalFields);

    for (let i = 0, len = sourceRecords.length; i < len; i += 1) {
        const targetRecord = targetRecords[i];
        const sourceRecord = sourceRecords[i];
        mergeRecordFields(targetRecord, sourceRecord);
    }
    return first;
}

/**
 * Checks that all records ids exist in both arrays
 * @param first batch of first array or records
 * @param second batch of second array or records
 * @returns
 */
function recordIdsAllMatch(first: RecordRepresentation[], second: RecordRepresentation[]): boolean {
    const firstIds = first.map((record) => record.id);
    const secondIds = second.map((record) => record.id);
    return firstIds.every((id) => secondIds.includes(id));
}

export function makeNetworkBatchGetRelatedListRecordsFields(
    networkAdapter: NetworkAdapter
): NetworkAdapter {
    return (resourceRequest: ResourceRequest) => {
        const batchRequestInfo = createAggregateBatchRequestInfo(
            resourceRequest,
            RELATED_LIST_RECORDS_ENDPOINT_REGEX
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
                response as AggregateResponse<RelatedListRecordCollectionRepresentation>,
                mergeRelatedRecordsFields
            );
        });
    };
}
