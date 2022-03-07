import type { NetworkAdapter, ResourceRequest } from '@luvio/engine';
import type { AggregateResponse } from './utils';
import {
    buildCompositeRequestByFields,
    createAggregateUiRequest,
    mergeAggregateUiResponse,
    mergeRecordFields,
    createAggregateBatchRequestInfo,
} from './utils';
import type {
    RecordRepresentation,
    RelatedListRecordCollectionRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { ScopedFieldsCollection } from './ScopedFields';
import { ArrayFrom } from '../../utils/language';

const RELATED_LIST_RECORDS_ENDPOINT_REGEX =
    /^\/ui-api\/related-list-records\/?(([a-zA-Z0-9]+))?\/?(([a-zA-Z0-9]+))?$/;
const referenceId = 'LDS_Related_List_Records_AggregateUi';
const QUERY_KEY_FIELDS = 'fields';
const QUERY_KEY_OPTIONAL_FIELDS = 'optionalFields';

export type RelatedListAggregateResponse =
    AggregateResponse<RelatedListRecordCollectionRepresentation>;

/**
 * Merge the second related list record collection into first one and return it.
 * It checks both collections should have exaction same records, otherwise error.
 * Exports it for unit tests
 */
export function mergeRelatedRecordsFields(
    first: RelatedListRecordCollectionRepresentation,
    second: RelatedListRecordCollectionRepresentation
): RelatedListRecordCollectionRepresentation {
    const { records: targetRecords } = first;
    const { records: sourceRecords } = second;

    if (
        sourceRecords.length === targetRecords.length &&
        recordIdsAllMatch(targetRecords, sourceRecords)
    ) {
        first.fields = first.fields.concat(second.fields);
        first.optionalFields = first.optionalFields.concat(second.optionalFields);

        for (let i = 0, len = sourceRecords.length; i < len; i += 1) {
            const targetRecord = targetRecords[i];
            const sourceRecord = sourceRecords[i];
            mergeRecordFields(targetRecord, sourceRecord);
        }

        mergePageUrls(first, second);

        return first;
    } else {
        // Throw error due to two collection are about different set of records
        // eslint-disable-next-line @salesforce/lds/no-error-in-production
        throw new Error('Aggregate UI response is invalid');
    }
}

export function makeNetworkChunkFieldsGetRelatedListRecords(
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

        const compositeRequest = buildCompositeRequestByFields(
            referenceId,
            resourceRequest,
            batchRequestInfo
        );

        const aggregateRequest = createAggregateUiRequest(resourceRequest, compositeRequest);

        return networkAdapter(aggregateRequest).then((response) => {
            return mergeAggregateUiResponse(
                response as RelatedListAggregateResponse,
                mergeRelatedRecordsFields
            );
        });
    };
}

/**
 * merge the second related list record collection into first one and return it
 */
function mergePageUrls(
    first: RelatedListRecordCollectionRepresentation,
    second: RelatedListRecordCollectionRepresentation
) {
    first.currentPageUrl = mergeUrl(first.currentPageUrl, second.currentPageUrl);
    first.previousPageUrl = mergeUrl(first.previousPageUrl, second.previousPageUrl);
    first.nextPageUrl = mergeUrl(first.nextPageUrl, second.nextPageUrl);
}

/**
 * merge to paging url with different set of fields or optional fields as combined one
 * the paging url is like
 * /services/data/v52.0/ui-api/related-list-records/001R0000006l1xKIAQ/Contacts
 * ?fields=Id%2CName&optionalFields=Contact.Id%2CContact.Name&pageSize=50&pageToken=0
 * @param path1 url path and query parmeter without domain
 * @param path2 url path and query parmeter without domain
 *
 * Export to unit test
 */
export function mergeUrl(path1: string | null, path2: string | null): string | null {
    if (path1 === null) return path2;
    if (path2 === null) return path1;

    // new Url(...) need the path1, path2 to be prefix-ed with this fake domain
    const domain = 'http://c.com';
    const url1 = new URL(domain + path1);
    const url2 = new URL(domain + path2);

    const searchParams1 = url1.searchParams;
    const fields = mergeFields(url1, url2, QUERY_KEY_FIELDS);
    if (fields && searchParams1.get(QUERY_KEY_FIELDS) !== fields) {
        searchParams1.set(QUERY_KEY_FIELDS, fields);
    }
    const optionalFields = mergeFields(url1, url2, QUERY_KEY_OPTIONAL_FIELDS);
    if (optionalFields && searchParams1.get(QUERY_KEY_OPTIONAL_FIELDS) !== optionalFields) {
        searchParams1.set(QUERY_KEY_OPTIONAL_FIELDS, optionalFields);
    }

    ArrayFrom(searchParams1.keys())
        .sort()
        .forEach((key) => {
            const value = searchParams1.get(key)!;
            searchParams1.delete(key);
            searchParams1.append(key, value);
        });

    return url1.toString().substr(domain.length);
}

function mergeFields(url1: URL, url2: URL, name: string): string {
    const fields1 = ScopedFieldsCollection.fromQueryParameterValue(url1.searchParams.get(name));
    const fields2 = ScopedFieldsCollection.fromQueryParameterValue(url2.searchParams.get(name));
    fields1.merge(fields2);
    return fields1.toQueryParameterValue();
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
