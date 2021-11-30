import {
    ingestSuccess as generatedIngestSuccess,
    ResourceRequestConfig,
    select as generatedSelect,
    keyBuilder as generatedKeyBuilder,
    keyBuilder,
    ingestError,
    createResourceRequest,
    createPaginationParams,
    getResponseCacheKeys,
} from '../../generated/resources/postUiApiRelatedListRecordsByParentRecordIdAndRelatedListId';
import {
    Luvio,
    SnapshotRefresh,
    Fragment,
    FulfilledSnapshot,
    ResourceResponse,
    StoreLink,
} from '@luvio/engine';
import { buildSelectionFromFields } from '../../selectors/record';
import { markMissingOptionalFields, isGraphNode } from '../../util/records';
import {
    RelatedListRecordCollectionRepresentation,
    ingest as types_RelatedListRecordCollectionRepresentation_ingest,
    dynamicSelect as types_RelatedListRecordCollectionRepresentation_dynamicSelect,
    DynamicSelectParams as types_RelatedListRecordCollectionRepresentation_DynamicSelectParams,
} from '../../generated/types/RelatedListRecordCollectionRepresentation';
import { isUnfulfilledSnapshot } from '../../util/snapshot';
import {
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../../generated/types/RecordRepresentation';

export {
    keyBuilder,
    ingestError,
    ResourceRequestConfig,
    createResourceRequest,
    getResponseCacheKeys,
};

export const select: typeof generatedSelect = (
    _luvio: Luvio,
    params: ResourceRequestConfig
): Fragment => {
    const { fields = [], optionalFields = [] } = params.body;

    const selectParams: types_RelatedListRecordCollectionRepresentation_DynamicSelectParams = {
        records: {
            name: 'records',
            kind: 'Link',
            fragment: {
                kind: 'Fragment',
                private: ['eTag', 'weakEtag'],
                selections: buildSelectionFromFields(fields, optionalFields),
            },
        },
    };

    return types_RelatedListRecordCollectionRepresentation_dynamicSelect(
        selectParams,
        createPaginationParams(params)
    );
};

export const ingestSuccess: typeof generatedIngestSuccess = (
    luvio: Luvio,
    resourceRequestConfig: ResourceRequestConfig,
    resp: ResourceResponse<RelatedListRecordCollectionRepresentation>,
    snapshotRefresh?: SnapshotRefresh<RelatedListRecordCollectionRepresentation>
) => {
    const { body } = resp;
    // TODO [W-8673110]: remove me after W-8673110 is sorted out.
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
        // TODO [W-8673110]: revert me after W-8673110 is sorted out.
        if (process.env.NODE_ENV !== 'production') {
            throw new Error(
                `${Object.keys(snapshot.missingPaths).join(
                    ', '
                )} missing immediately after get-related-list-records request.
                Requested fields: ${
                    resourceRequestConfig.body.fields === null ||
                    resourceRequestConfig.body.fields === undefined
                        ? undefined
                        : resourceRequestConfig.body.fields.join()
                }
                Requested optionalFields: ${
                    resourceRequestConfig.body.optionalFields === null ||
                    resourceRequestConfig.body.optionalFields === undefined
                        ? undefined
                        : resourceRequestConfig.body.optionalFields.join()
                }
                ${returnedFieldsDebug}`
            );
        }
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
            const node =
                luvio.getNode<RecordRepresentationNormalized, RecordRepresentation>(recordKey);
            if (isGraphNode(node)) {
                markMissingOptionalFields(node, optionalFields);
            }
        }
    }
}
