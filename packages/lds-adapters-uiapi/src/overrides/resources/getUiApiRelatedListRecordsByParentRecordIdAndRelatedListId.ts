import {
    ingestSuccess as generatedIngestSuccess,
    ResourceRequestConfig,
    select as generatedSelect,
    keyBuilder as generatedKeyBuilder,
    keyBuilder,
    ingestError,
    createResourceRequest,
} from './../../generated/resources/getUiApiRelatedListRecordsByParentRecordIdAndRelatedListId';
import {
    Luvio,
    SnapshotRefresh,
    Fragment,
    FulfilledSnapshot,
    ResourceResponse,
    StoreLink,
} from '@luvio/engine';
import { select as RelatedListReferenceRepresentation_select } from '../../generated/types/RelatedListReferenceRepresentation';
import { buildSelectionFromFields } from '../../selectors/record';
import {
    records as ListRecordCollectionRepresentation_reader_records,
    variables as ListRecordCollectionRepresentation_reader_variables,
    url as ListRecordCollectionRepresentation_reader_url,
} from '../../helpers/ListRecordCollectionRepresentation/readers';
import { staticValuePathSelection } from '../../util/pagination';
import { markMissingOptionalFields, isGraphNode } from '../../util/records';
import {
    paginationKeyBuilder as RelatedListRecordCollection_paginationKeyBuilder,
    RelatedListRecordCollectionRepresentation,
    ingest as types_RelatedListRecordCollectionRepresentation_ingest,
} from '../../generated/types/RelatedListRecordCollectionRepresentation';
import { isUnfulfilledSnapshot } from '../../util/snapshot';
import {
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../../generated/types/RecordRepresentation';

export { keyBuilder, ingestError, ResourceRequestConfig, createResourceRequest };

const DEFAULT_PAGE_SIZE = 50;
const RELATED_LIST_REFERENCE_SELECTIONS = RelatedListReferenceRepresentation_select().selections;

export const select: typeof generatedSelect = (
    _luvio: Luvio,
    params: ResourceRequestConfig
): Fragment => {
    const { queryParams, urlParams } = params;
    const { relatedListId, parentRecordId } = urlParams;
    let {
        fields = [],
        optionalFields = [],
        sortBy = [],
        pageToken,
        pageSize = DEFAULT_PAGE_SIZE,
    } = queryParams;

    return {
        kind: 'Fragment',
        private: [],
        selections: [
            {
                kind: 'Custom',
                name: 'records',
                plural: true,
                selections: buildSelectionFromFields(fields, optionalFields),
                tokenDataKey: RelatedListRecordCollection_paginationKeyBuilder({
                    sortBy,
                    parentRecordId,
                    relatedListId,
                }),
                pageToken,
                pageSize,
                reader: ListRecordCollectionRepresentation_reader_records,
            },
            {
                kind: 'Object',
                name: 'listReference',
                selections: RELATED_LIST_REFERENCE_SELECTIONS,
            },
            {
                kind: 'Custom',
                name: 'count',
                reader: ListRecordCollectionRepresentation_reader_variables,
            },
            {
                kind: 'Custom',
                name: 'currentPageToken',
                reader: ListRecordCollectionRepresentation_reader_variables,
            },
            {
                kind: 'Scalar',
                name: 'currentPageUrl',
            },
            {
                kind: 'Scalar',
                name: 'fields',
                plural: true,
            },
            {
                kind: 'Scalar',
                name: 'optionalFields',
                plural: true,
            },
            {
                kind: 'Scalar',
                name: 'listInfoETag',
            },
            {
                kind: 'Custom',
                name: 'nextPageToken',
                reader: ListRecordCollectionRepresentation_reader_variables,
            },
            {
                kind: 'Custom',
                name: 'nextPageUrl',
                reader: ListRecordCollectionRepresentation_reader_url,
            },
            {
                kind: 'Custom',
                name: 'previousPageToken',
                reader: ListRecordCollectionRepresentation_reader_variables,
            },
            {
                kind: 'Custom',
                name: 'previousPageUrl',
                reader: ListRecordCollectionRepresentation_reader_url,
            },
            staticValuePathSelection({
                name: 'pageSize',
                value: pageSize === undefined ? DEFAULT_PAGE_SIZE : pageSize,
            }),
            {
                kind: 'Scalar',
                name: 'sortBy',
                plural: true,
            },
        ],
    };
};

export const ingestSuccess: typeof generatedIngestSuccess = (
    luvio: Luvio,
    resourceRequestConfig: ResourceRequestConfig,
    resp: ResourceResponse<RelatedListRecordCollectionRepresentation>,
    snapshotRefresh?: SnapshotRefresh<RelatedListRecordCollectionRepresentation>
) => {
    const { body } = resp;
    // TODO: remove me after W-8673110 is sorted out.
    const returnedFieldsDebug = body.records.map(
        (record, index) =>
            `Returned fields for ${index}, apiName: ${record.apiName}: ` +
            Object.keys(record.fields || {}).join()
    );

    const key = generatedKeyBuilder(resourceRequestConfig);

    luvio.storeIngest<RelatedListRecordCollectionRepresentation>(
        key,
        types_RelatedListRecordCollectionRepresentation_ingest,
        body
    );

    if (body.optionalFields && body.optionalFields.length > 0) {
        markMissingOptionalRecordFieldsMissing(
            <StoreLink[]>body.records,
            body.optionalFields,
            luvio
        );
    }

    const snapshot = luvio.storeLookup<RelatedListRecordCollectionRepresentation>(
        {
            recordId: key,
            node: select(luvio, resourceRequestConfig),
            variables: {},
        },
        snapshotRefresh
    );

    if (isUnfulfilledSnapshot(snapshot)) {
        // TODO: revert me after W-8673110 is sorted out.
        throw new Error(
            `${Object.keys(snapshot.missingPaths).join(
                ', '
            )} missing immediately after get-related-list-records request.
            Requested fields: ${
                resourceRequestConfig.queryParams.fields === null ||
                resourceRequestConfig.queryParams.fields === undefined
                    ? undefined
                    : resourceRequestConfig.queryParams.fields.join()
            }
            Requested optionalFields: ${
                resourceRequestConfig.queryParams.optionalFields === null ||
                resourceRequestConfig.queryParams.optionalFields === undefined
                    ? undefined
                    : resourceRequestConfig.queryParams.optionalFields.join()
            }
            ${returnedFieldsDebug}`
        );
    }

    return snapshot as FulfilledSnapshot<RelatedListRecordCollectionRepresentation, any>;
};
export default createResourceRequest;

function markMissingOptionalRecordFieldsMissing(
    returnedRecords: StoreLink[],
    optionalFields: string[],
    luvio: Luvio
) {
    for (let i = 0; i < returnedRecords.length; i++) {
        const record = returnedRecords[i];
        const recordKey = record.__ref;
        if (recordKey) {
            const node = luvio.getNode<RecordRepresentationNormalized, RecordRepresentation>(
                recordKey
            );
            if (isGraphNode(node)) {
                markMissingOptionalFields(node, optionalFields);
            }
        }
    }
}
