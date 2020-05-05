import {
    LDS,
    Fragment,
    Reader,
    ResourceRequest,
    FetchResponse,
    SnapshotRefresh,
    FulfilledSnapshot,
    ErrorSnapshot,
} from '@ldsjs/engine';
import {
    ResourceRequestConfig,
    createChildResourceParams as generatedCreateChildResourceParams,
} from '../../generated/resources/getUiApiRelatedListRecordsBatchByParentRecordIdAndRelatedListIds';
// Single Wire Imports
import {
    ResourceRequestConfig as singleWireResourceRequestConfig,
    keyBuilder as singleWireKeyBuilder,
    select as singleWireSelect,
    ingestSuccess as sinlgeWireIngestSuccess,
    createResourceRequest as singleWireCreateResourceRequest,
    ingestError as singleWireIngestError,
} from './getUiApiRelatedListRecordsByParentRecordIdAndRelatedListId';

// Generated Types
import {
    ingest,
    RelatedListRecordCollectionBatchRepresentation,
} from '../../generated/types/RelatedListRecordCollectionBatchRepresentation';
import { RelatedListRecordCollectionRepresentation } from '../../generated/types/RelatedListRecordCollectionRepresentation';
import { CompositeRelatedListRecordCollectionResultRepresentation } from '../../generated/types/CompositeRelatedListRecordCollectionResultRepresentation';
// Generated Adapter Utils
import {
    ObjectFreeze,
    ArrayPrototypePush,
    keyPrefix,
    getFetchResponseStatusText,
} from '../../generated/adapters/adapter-utils';

export { ResourceRequestConfig };

export const createChildResourceParams: typeof generatedCreateChildResourceParams = (
    resourceParams: ResourceRequestConfig
) => {
    const childConfigs: singleWireResourceRequestConfig[] = [];
    for (
        let index = 0, len = resourceParams.urlParams.relatedListIds.length;
        index < len;
        index += 1
    ) {
        const relatedListId = resourceParams.urlParams.relatedListIds[index];
        const fields = extractSingleResourceParamsFromBatchParamString(
            relatedListId,
            resourceParams.queryParams.fields
        )?.split(',');
        const optionalFields = extractSingleResourceParamsFromBatchParamString(
            relatedListId,
            resourceParams.queryParams.optionalFields
        )?.split(',');
        const sortBy = extractSingleResourceParamsFromBatchParamString(
            relatedListId,
            resourceParams.queryParams.sortBy
        )?.split(',');
        const pageSize = extractSingleResourceParamsFromBatchParamString(
            relatedListId,
            resourceParams.queryParams.pageSize
        );

        childConfigs.push({
            urlParams: {
                parentRecordId: resourceParams.urlParams.parentRecordId,
                relatedListId: relatedListId,
            },
            queryParams: {
                fields: fields,
                optionalFields: optionalFields,
                sortBy: sortBy,
                pageSize: pageSize ? Number(pageSize) : undefined,
            },
        });
    }
    return childConfigs;
};

function extractSingleResourceParamsFromBatchParamString(
    relatedListId: string,
    batchParamString?: string
): string | undefined {
    return batchParamString
        ?.split(';')
        .find(field => field.startsWith(relatedListId))
        ?.slice(relatedListId.length + 1);
}

// HUGE BLOCK OF COPY PASTED CODE:
// WE NEED TO DO THIS SO THAT THE ADAPTER CAN USE ONLY OUR OVERRIDE FILE
// PLEASE DO NOT CHANGE ANYTHING HERE...
export function select(lds: LDS, resourceParams: ResourceRequestConfig): Fragment {
    const childResources = createChildResourceParams(resourceParams);
    const envelopeBodyPath = 'result';
    const envelopeStatusCodePath = 'statusCode';
    const envelopePath = 'results';
    return {
        kind: 'Fragment',
        reader: true,
        synthetic: true,
        read: (reader: Reader<any>) => {
            const sink = {} as RelatedListRecordCollectionBatchRepresentation;
            reader.enterPath(envelopePath);
            const results = [] as RelatedListRecordCollectionBatchRepresentation['results'];

            for (let i = 0, len = childResources.length; i < len; i += 1) {
                reader.enterPath(i);
                const childResource = childResources[i];
                const childKey = singleWireKeyBuilder(childResource);
                const childFragment = singleWireSelect(lds, childResource);
                const childSnapshot = reader.read<RelatedListRecordCollectionRepresentation>({
                    recordId: childKey,
                    node: childFragment,
                    variables: {},
                });

                const childSink = {} as CompositeRelatedListRecordCollectionResultRepresentation;
                switch (childSnapshot.state) {
                    case 'Fulfilled':
                        reader.enterPath(envelopeStatusCodePath);
                        reader.assignScalar(envelopeStatusCodePath, childSink, 200);
                        reader.exitPath();

                        reader.enterPath(envelopeBodyPath);
                        reader.assignNonScalar(childSink, envelopeBodyPath, childSnapshot.data);
                        reader.exitPath();
                        break;
                    case 'Error':
                        // eslint-disable-next-line no-case-declarations
                        const { error: childSnapshotError } = childSnapshot;
                        reader.enterPath(envelopeStatusCodePath);
                        reader.assignScalar(
                            envelopeStatusCodePath,
                            childSink,
                            childSnapshotError.status
                        );
                        reader.exitPath();

                        reader.enterPath(envelopeBodyPath);
                        reader.assignNonScalar(
                            childSink,
                            envelopeBodyPath,
                            childSnapshotError.body
                        );
                        reader.exitPath();
                        break;
                    case 'Unfulfilled':
                        reader.markMissing();
                        break;
                    case 'Pending':
                        reader.markPending();
                        break;
                    case 'Stale':
                        reader.markStale();
                        break;
                }
                ObjectFreeze(childSink);
                ArrayPrototypePush.call(results, childSink);
                reader.exitPath();
            }

            reader.assignNonScalar(sink, envelopePath, results);

            ObjectFreeze(sink);
            reader.exitPath();
            return sink;
        },
    };
}

export function keyBuilder(params: ResourceRequestConfig): string {
    return (
        keyPrefix +
        'RelatedListRecordCollectionBatchRepresentation(' +
        'fields:' +
        params.queryParams.fields +
        ',' +
        'optionalFields:' +
        params.queryParams.optionalFields +
        ',' +
        'pageSize:' +
        params.queryParams.pageSize +
        ',' +
        'sortBy:' +
        params.queryParams.sortBy +
        ',' +
        'parentRecordId:' +
        params.urlParams.parentRecordId +
        ',' +
        'relatedListIds:' +
        params.urlParams.relatedListIds +
        ')'
    );
}

export function ingestSuccess(
    lds: LDS,
    resourceParams: ResourceRequestConfig,
    _request: ResourceRequest,
    response: FetchResponse<RelatedListRecordCollectionBatchRepresentation>,
    _snapshotRefresh?: SnapshotRefresh<RelatedListRecordCollectionBatchRepresentation>
): FulfilledSnapshot<RelatedListRecordCollectionBatchRepresentation, any> {
    const childEnvelopes = response.body.results;
    const childResourceParamsArray = createChildResourceParams(resourceParams);
    if (process.env.NODE_ENV !== 'production') {
        if (childResourceParamsArray.length !== childEnvelopes.length) {
            throw new Error(
                'Invalid composite resource response. Expected ' +
                    childResourceParamsArray.length +
                    ' items, received ' +
                    childEnvelopes.length
            );
        }
    }

    const snapshotStateFulfilled = 'Fulfilled';
    const key = keyBuilder(resourceParams);
    const childSnapshotDataResponses: RelatedListRecordCollectionBatchRepresentation['results'] = [];
    let seenRecords: FulfilledSnapshot<
        RelatedListRecordCollectionBatchRepresentation,
        {}
    >['seenRecords'] = {};

    for (let index = 0, len = childResourceParamsArray.length; index < len; index += 1) {
        const childResourceParams = childResourceParamsArray[index];
        const result = childEnvelopes[index];
        const childStatusCodeText = getFetchResponseStatusText(result.statusCode);

        if (result.statusCode === 200) {
            const { statusCode: childStatusCode, result: childBody } = result;
            const childResponse = {
                status: childStatusCode,
                body: childBody,
                ok: true,
                statusText: childStatusCodeText,
                headers: {},
            };

            const childSnapshot = sinlgeWireIngestSuccess(
                lds,
                childResourceParams,
                singleWireCreateResourceRequest(childResourceParams),
                childResponse
            );
            seenRecords = {
                ...seenRecords,
                ...childSnapshot.seenRecords,
                [childSnapshot.recordId]: true,
            };
            const childValue = {
                statusCode: childStatusCode,
                result: childSnapshot.data,
            };
            ObjectFreeze(childValue);

            childSnapshotDataResponses.push(childValue);
        } else {
            const { statusCode: childStatusCode, result: childBody } = result;
            const childResponse = {
                status: childStatusCode,
                body: childBody,
                ok: false,
                statusText: childStatusCodeText,
                headers: {},
            };
            singleWireIngestError(lds, childResourceParams, childResponse);
            seenRecords = {
                ...seenRecords,
                [singleWireKeyBuilder(childResourceParams)]: true,
            };
            const childValue = {
                statusCode: childStatusCode,
                result: childBody,
            };
            ObjectFreeze(childValue);

            childSnapshotDataResponses.push(childValue);
        }
    }

    ObjectFreeze(childSnapshotDataResponses);

    const childSnapshotData: RelatedListRecordCollectionBatchRepresentation = {
        results: childSnapshotDataResponses,
    };

    ObjectFreeze(childSnapshotData);

    return {
        recordId: key,
        data: childSnapshotData,
        state: snapshotStateFulfilled,
        seenRecords: seenRecords,
        select: {
            recordId: key,
            node: select(lds, resourceParams),
            variables: {},
        },
        variables: {},
    } as FulfilledSnapshot<RelatedListRecordCollectionBatchRepresentation, any>;
}

export function ingestError(
    lds: LDS,
    params: ResourceRequestConfig,
    error: FetchResponse<unknown>,
    snapshotRefresh?: SnapshotRefresh<RelatedListRecordCollectionBatchRepresentation>
): ErrorSnapshot {
    const key = keyBuilder(params);
    lds.storeIngestFetchResponse(key, error);
    return lds.errorSnapshot(error, snapshotRefresh);
}

export function createResourceRequest(config: ResourceRequestConfig) {
    const headers: { [key: string]: string } = {};

    return {
        baseUri: '/services/data/v50.0',
        basePath:
            '/ui-api/related-list-records/batch/' +
            config.urlParams.parentRecordId +
            '/' +
            config.urlParams.relatedListIds +
            '',
        method: 'get',
        body: null,
        urlParams: config.urlParams,
        queryParams: config.queryParams,
        ingest: ingest,
        headers,
    };
}

export default createResourceRequest;
