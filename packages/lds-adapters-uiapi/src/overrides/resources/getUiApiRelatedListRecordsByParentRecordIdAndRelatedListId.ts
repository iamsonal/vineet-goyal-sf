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
    LDS,
    ResourceRequest,
    SnapshotRefresh,
    Fragment,
    FulfilledSnapshot,
    ResourceResponse,
} from '@ldsjs/engine';
import { select as RelatedListReferenceRepresentation_select } from '../../generated/types/RelatedListReferenceRepresentation';
import { buildSelectionFromFields } from '../../selectors/record';
import {
    records as ListRecordCollectionRepresentation_reader_records,
    variables as ListRecordCollectionRepresentation_reader_variables,
    url as ListRecordCollectionRepresentation_reader_url,
} from '../../helpers/ListRecordCollectionRepresentation/readers';
import { staticValuePathSelection } from '../../util/pagination';
import {
    paginationKeyBuilder as RelatedListRecordCollection_paginationKeyBuilder,
    RelatedListRecordCollectionRepresentation,
} from '../../generated/types/RelatedListRecordCollectionRepresentation';
import { isUnfulfilledSnapshot } from '../../util/snapshot';

export { keyBuilder, ingestError, ResourceRequestConfig, createResourceRequest };

const DEFAULT_PAGE_SIZE = 50;
const RELATED_LIST_REFERENCE_SELECTIONS = RelatedListReferenceRepresentation_select().selections;

export const select: typeof generatedSelect = (
    lds: LDS,
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

    // TODO - records code needs to be updated to support optional & required fields, this should be changed before ga
    fields = fields.concat(optionalFields).map(field => {
        return `${relatedListId}.${field}`;
    });

    return {
        kind: 'Fragment',
        private: ['eTag'],
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
    lds: LDS,
    resourceRequestConfig: ResourceRequestConfig,
    request: ResourceRequest,
    resp: ResourceResponse<RelatedListRecordCollectionRepresentation>,
    snapshotRefresh?: SnapshotRefresh<RelatedListRecordCollectionRepresentation>
) => {
    const { body } = resp;

    const key = generatedKeyBuilder(resourceRequestConfig);
    lds.storeIngest<RelatedListRecordCollectionRepresentation>(key, request.ingest, body);
    const snapshot = lds.storeLookup<RelatedListRecordCollectionRepresentation>(
        {
            recordId: key,
            node: select(lds, resourceRequestConfig),
            variables: {},
        },
        snapshotRefresh
    );

    if (isUnfulfilledSnapshot(snapshot)) {
        throw new Error(
            `${Object.keys(snapshot.missingPaths).join(
                ', '
            )} missing immediately after get-related-list-records request`
        );
    }

    return snapshot as FulfilledSnapshot<RelatedListRecordCollectionRepresentation, any>;
};
export default createResourceRequest;
