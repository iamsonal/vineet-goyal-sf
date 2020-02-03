import { Selector, Fragment, PathSelection } from '@ldsjs/engine';

import { extractRecordFields, buildSelectionFromFields } from './../../selectors/record';
import {
    records as ListRecordCollectionRepresentation_reader_records,
    variables as ListRecordCollectionRepresentation_reader_variables,
    url as ListRecordCollectionRepresentation_reader_url,
} from '../../helpers/ListRecordCollectionRepresentation/readers';

import {
    paginationKeyBuilder as RelatedListRecordCollection_paginationKeyBuilder,
    RelatedListRecordCollectionRepresentation,
} from '../../generated/types/RelatedListRecordCollectionRepresentation';
import { GetRelatedListRecordsConfig } from '../../generated/adapters/getRelatedListRecords';
import { staticValuePathSelection } from '../../util/pagination';
import { select as RelatedListReferenceRepresentation_select } from '../../generated/types/RelatedListReferenceRepresentation';

// Constants
const DEFAULT_PAGE_SIZE = 50;
const RELATED_LIST_REFERENCE_SELECTIONS = RelatedListReferenceRepresentation_select().selections;

export function buildRelatedListRecordCollectionSelector(
    cacheKey: string,
    config: GetRelatedListRecordsConfig,
    response?: RelatedListRecordCollectionRepresentation
): Selector<any> {
    return {
        recordId: cacheKey,
        node: { kind: 'Fragment', selections: buildSelections(config, response) } as Fragment,
        variables: {},
    };
}

function buildSelections(
    config: GetRelatedListRecordsConfig,
    response?: RelatedListRecordCollectionRepresentation
): PathSelection[] {
    let {
        fields = [],
        optionalFields = [],
        sortBy = [],
        relatedListId,
        parentRecordId,
        pageToken,
        pageSize = DEFAULT_PAGE_SIZE,
    } = config;

    // TODO - records code needs to be updated to support optional & required fields, this should be changed before ga
    fields = fields.concat(optionalFields).map(field => {
        return `${relatedListId}.${field}`;
    });

    // TODO Field-level security among other things can break this assumption of using the first records fields
    if (fields.length === 0 && response && response.records && response.records.length > 0) {
        fields = extractRecordFields(response.records[0]);
    }

    // TODO W-6741077 Add currentPageUrl back to selectors once it is returned in the uiapi
    return [
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
            value: config.pageSize === undefined ? DEFAULT_PAGE_SIZE : config.pageSize,
        }),
        {
            kind: 'Scalar',
            name: 'sortBy',
            plural: true,
        },
    ];
}
