import {
    Luvio,
    Fragment,
    Reader,
    ResourceRequest,
    FetchResponse,
    SnapshotRefresh,
    FulfilledSnapshot,
    ErrorSnapshot,
    CacheKeySet,
} from '@luvio/engine';
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
    ingestError as singleWireIngestError,
    getResponseCacheKeys as singleWireGetResponseCacheKeys,
} from './postUiApiRelatedListRecordsByParentRecordIdAndRelatedListId';

// Generated Types
import { RelatedListRecordCollectionBatchRepresentation } from '../../generated/types/RelatedListRecordCollectionBatchRepresentation';
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
        const fieldsString = extractSingleResourceParamsFromBatchParamString(
            relatedListId,
            resourceParams.queryParams.fields
        );
        const fields = fieldsString === undefined ? undefined : fieldsString.split(',');
        const optionalFieldsString = extractSingleResourceParamsFromBatchParamString(
            relatedListId,
            resourceParams.queryParams.optionalFields
        );
        const optionalFields =
            optionalFieldsString === undefined ? undefined : optionalFieldsString.split(',');
        const sortByString = extractSingleResourceParamsFromBatchParamString(
            relatedListId,
            resourceParams.queryParams.sortBy
        );
        const sortBy = sortByString === undefined ? undefined : sortByString.split(',');
        const pageSize = extractSingleResourceParamsFromBatchParamString(
            relatedListId,
            resourceParams.queryParams.pageSize
        );

        childConfigs.push({
            urlParams: {
                parentRecordId: resourceParams.urlParams.parentRecordId,
                relatedListId: relatedListId,
            },
            body: {
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
    if (batchParamString === undefined) {
        return undefined;
    }

    const match = batchParamString
        .split(';')
        .find((fieldString) => fieldString.split(':')[0] === relatedListId);
    return match === undefined ? undefined : match.slice(relatedListId.length + 1);
}

// HUGE BLOCK OF COPY PASTED CODE:
// WE NEED TO DO THIS SO THAT THE ADAPTER CAN USE ONLY OUR OVERRIDE FILE
// PLEASE DO NOT CHANGE ANYTHING HERE...
export function select(luvio: Luvio, resourceParams: ResourceRequestConfig): Fragment {
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
                const childFragment = singleWireSelect(luvio, childResource);
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
        '::' +
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

export function getResponseCacheKeys(
    resourceParams: ResourceRequestConfig,
    response: RelatedListRecordCollectionBatchRepresentation
): CacheKeySet {
    let keys: CacheKeySet = {};

    const childEnvelopes = response.results;
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

    // get children keys
    for (let index = 0, len = childResourceParamsArray.length; index < len; index++) {
        const childResourceParams = childResourceParamsArray[index];
        const childResult = childEnvelopes[index];
        const { statusCode: childStatusCode, result: childBody } = childResult;
        if (childStatusCode === 200) {
            const childKeys = singleWireGetResponseCacheKeys(
                childResourceParams,
                childBody as RelatedListRecordCollectionRepresentation
            );
            keys = { ...keys, ...childKeys };
        } else if (childStatusCode === 404) {
            const childKey = singleWireKeyBuilder(childResourceParams);
            keys[childKey] = {
                namespace: keyPrefix,
                representationName: childKey.split('::')[1].split(':')[0],
            };
        }
    }

    return keys;
}

export function ingestSuccess(
    luvio: Luvio,
    resourceParams: ResourceRequestConfig,
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

    let snapshotState = 'Fulfilled';
    const key = keyBuilder(resourceParams);
    const childSnapshotDataResponses: RelatedListRecordCollectionBatchRepresentation['results'] =
        [];
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
                luvio,
                childResourceParams,
                childResponse
            );
            seenRecords = {
                ...seenRecords,
                ...childSnapshot.seenRecords,
                [childSnapshot.recordId]: true,
            };
            if (childSnapshot.state === 'Pending') {
                snapshotState = 'Pending';
                break;
            }
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
            singleWireIngestError(luvio, childResourceParams, childResponse);
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
        state: snapshotState,
        seenRecords: seenRecords,
        select: {
            recordId: key,
            node: select(luvio, resourceParams),
            variables: {},
        },
        variables: {},
    } as FulfilledSnapshot<RelatedListRecordCollectionBatchRepresentation, any>;
}

export function ingestError(
    luvio: Luvio,
    params: ResourceRequestConfig,
    error: FetchResponse<unknown>,
    snapshotRefresh?: SnapshotRefresh<RelatedListRecordCollectionBatchRepresentation>
): ErrorSnapshot {
    const key = keyBuilder(params);
    const errorSnapshot = luvio.errorSnapshot(error, snapshotRefresh);
    luvio.storeIngestError(key, errorSnapshot);
    return errorSnapshot;
}

export function createResourceRequest(config: ResourceRequestConfig): ResourceRequest {
    const headers: { [key: string]: string } = {};

    return {
        baseUri: '/services/data/v54.0',
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
        headers,
    };
}

export default createResourceRequest;
