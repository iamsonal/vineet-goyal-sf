import {
    Luvio,
    Fragment,
    Reader,
    ResourceResponse,
    FetchResponse,
    SnapshotRefresh,
    FulfilledSnapshot,
    ErrorSnapshot,
    CacheKeySet,
    StaleSnapshot,
    PendingSnapshot,
} from '@luvio/engine';

import {
    ObjectCreate,
    ObjectFreeze,
    ArrayPrototypePush,
    keyPrefix,
    getFetchResponseStatusText,
} from '../../generated/adapters/adapter-utils';

import {
    ResourceRequestConfig as getUiApiListInfoByListViewApiNameAndObjectApiName_ResourceRequestConfig,
    keyBuilder as getUiApiListInfoByListViewApiNameAndObjectApiName_keyBuilder,
    select as getUiApiListInfoByListViewApiNameAndObjectApiName_select,
    getResponseCacheKeys as getUiApiListInfoByListViewApiNameAndObjectApiName_getResponseCacheKeys,
    ingestSuccess as getUiApiListInfoByListViewApiNameAndObjectApiName_ingestSuccess,
    ingestError as getUiApiListInfoByListViewApiNameAndObjectApiName_ingestError,
} from '../../generated/resources/getUiApiListInfoByListViewApiNameAndObjectApiName';

import { ListInfoBatchRepresentation as types_ListInfoBatchRepresentation_ListInfoBatchRepresentation } from '../../generated/types/ListInfoBatchRepresentation';
import {
    ListInfoRepresentation as types_ListInfoRepresentation_ListInfoRepresentation,
    TTL as types_ListInfoRepresentation_TTL,
} from '../../generated/types/ListInfoRepresentation';
import { SimpleListInfoResultRepresentation as types_SimpleListInfoResultRepresentation_SimpleListInfoResultRepresentation } from '../../generated/types/SimpleListInfoResultRepresentation';
const nonCachedErrors: {
    [key: string]: { expiration: number; response: FetchResponse<any>; status: number } | undefined;
} = ObjectCreate(null);

export function createChildResourceParams(
    resourceParams: ResourceRequestConfig
): getUiApiListInfoByListViewApiNameAndObjectApiName_ResourceRequestConfig[] {
    const childConfigs: getUiApiListInfoByListViewApiNameAndObjectApiName_ResourceRequestConfig[] =
        [];
    const { queryParams } = resourceParams;
    const { names = [] } = queryParams;

    for (const name of names) {
        const [objectApiName, listViewApiName] = name.split('.');

        childConfigs.push({
            urlParams: {
                objectApiName,
                listViewApiName,
            },
        });
    }

    return childConfigs;
}

export interface ResourceRequestConfig {
    queryParams: {
        ids?: Array<string>;
        names?: Array<string>;
    };
}

export function selectChildResourceParams(
    luvio: Luvio,
    childResources: getUiApiListInfoByListViewApiNameAndObjectApiName_ResourceRequestConfig[],
    resourceParams: ResourceRequestConfig
): Fragment {
    const envelopeBodyPath = 'result';
    const envelopeStatusCodePath = 'statusCode';
    const envelopePath = 'results';
    return {
        kind: 'Fragment',
        reader: true,
        synthetic: true,
        read: (reader: Reader<any>) => {
            // Top-level 404 lookup
            const compositeSnapshot = luvio.storeLookup<any>({
                recordId: keyBuilder(resourceParams),
                node: {
                    kind: 'Fragment',
                    private: [],
                },
                variables: {},
            });
            if (compositeSnapshot.state === 'Error' && compositeSnapshot.error.status === 404) {
                return {
                    state: compositeSnapshot.state,
                    value: compositeSnapshot.error,
                };
            }
            const sink = {} as types_ListInfoBatchRepresentation_ListInfoBatchRepresentation;
            reader.enterPath(envelopePath);
            const results =
                [] as types_ListInfoBatchRepresentation_ListInfoBatchRepresentation['results'];
            for (let i = 0, len = childResources.length; i < len; i += 1) {
                reader.enterPath(i);
                reader.enterPath(envelopeBodyPath);
                const childResource = childResources[i];
                const childKey =
                    getUiApiListInfoByListViewApiNameAndObjectApiName_keyBuilder(childResource);
                const childFragment = getUiApiListInfoByListViewApiNameAndObjectApiName_select(
                    luvio,
                    childResource
                );
                const isMissingDataBeforeChildRead = reader.getIsDataMissing();
                const childSnapshot =
                    reader.read<types_ListInfoRepresentation_ListInfoRepresentation>({
                        recordId: childKey,
                        node: childFragment,
                        variables: {},
                    });
                reader.exitPath();
                const childSink =
                    {} as types_SimpleListInfoResultRepresentation_SimpleListInfoResultRepresentation;
                reader.markSeenId(childKey);
                switch (childSnapshot.state) {
                    case 'Stale':
                        reader.markStale();
                    // Stale needs envelope bodies filled in so don't break
                    // eslint-disable-next-line no-fallthrough
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
                        // if child snapshot doesn't have any data then
                        // that means the child record key is missing
                        if (childSnapshot.data === undefined) {
                            if (reader.isRebuilding() === false) {
                                // not a rebuild, mark as missing and move on
                                reader.markMissingLink(childKey);
                                break;
                            }

                            // On rebuilds we have to check if there is a non-cached
                            // error that we know about.  If we don't do this then
                            // rebuilds will go into endless refresh loop if a child
                            // has non-cached errors (since the top-level composite
                            // snapshot will look like an Unfulfilled snapshot
                            // instead of an error snapshot).
                            const nonCachedError = nonCachedErrors[childKey];

                            if (
                                nonCachedError === undefined ||
                                nonCachedError.expiration < reader.getTimeStamp()
                            ) {
                                reader.markMissingLink(childKey);
                            } else {
                                // if this child error was the only reason the reader
                                // is marked as missing then we want to undo that
                                if (isMissingDataBeforeChildRead === false) {
                                    reader.unMarkMissing();
                                }

                                // put status code and body into reader path
                                const { response: nonCachedBody, status: nonCachedStatus } =
                                    nonCachedError;
                                reader.enterPath(envelopeStatusCodePath);
                                reader.assignScalar(
                                    envelopeStatusCodePath,
                                    childSink,
                                    nonCachedStatus
                                );
                                reader.exitPath();
                                reader.enterPath(envelopeBodyPath);
                                reader.assignNonScalar(childSink, envelopeBodyPath, nonCachedBody);
                                reader.exitPath();
                            }
                        }
                        break;
                    case 'Pending':
                        reader.markPending();
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

export function select(luvio: Luvio, resourceParams: ResourceRequestConfig): Fragment {
    const childResources = createChildResourceParams(resourceParams);
    return selectChildResourceParams(luvio, childResources, resourceParams);
}

export function keyBuilder(params: ResourceRequestConfig): string {
    return (
        keyPrefix +
        '::ListInfoBatchRepresentation:(' +
        'ids:' +
        params.queryParams.ids +
        ',' +
        'names:' +
        params.queryParams.names +
        ')'
    );
}

export function getResponseCacheKeys(
    resourceParams: ResourceRequestConfig,
    response: types_ListInfoBatchRepresentation_ListInfoBatchRepresentation
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
            const childKeys =
                getUiApiListInfoByListViewApiNameAndObjectApiName_getResponseCacheKeys(
                    childResourceParams,
                    childBody as types_ListInfoRepresentation_ListInfoRepresentation
                );
            keys = { ...keys, ...childKeys };
        } else if (childStatusCode === 404) {
            const childKey =
                getUiApiListInfoByListViewApiNameAndObjectApiName_keyBuilder(childResourceParams);
            keys[childKey] = {
                namespace: keyPrefix,
                representationName: childKey.split('::')[1].split(':')[0],
            };
        }
    }

    return keys;
}

export function ingestSuccessChildResourceParams(
    luvio: Luvio,
    childResourceParamsArray: getUiApiListInfoByListViewApiNameAndObjectApiName_ResourceRequestConfig[],
    childEnvelopes: Array<any>
): {
    childSnapshotData: types_ListInfoBatchRepresentation_ListInfoBatchRepresentation;
    seenRecords: { [key: string]: boolean };
    snapshotState: string;
} {
    const childSnapshotDataResponses: types_ListInfoBatchRepresentation_ListInfoBatchRepresentation['results'] =
        [];
    let seenRecords: FulfilledSnapshot<
        types_ListInfoBatchRepresentation_ListInfoBatchRepresentation,
        {}
    >['seenRecords'] = {};
    let snapshotState = 'Fulfilled';
    const now = Date.now();
    for (let index = 0, len = childResourceParamsArray.length; index < len; index += 1) {
        const childResourceParams = childResourceParamsArray[index];
        const childKey =
            getUiApiListInfoByListViewApiNameAndObjectApiName_keyBuilder(childResourceParams);
        const result = childEnvelopes[index];
        const { statusCode: childStatusCode, result: childBody } = result;
        if (childStatusCode === 200) {
            const childResponse: ResourceResponse<types_ListInfoRepresentation_ListInfoRepresentation> =
                {
                    status: 200,
                    body: childBody,
                    ok: true,
                    statusText: 'OK',
                    headers: undefined,
                };
            const childSnapshot = getUiApiListInfoByListViewApiNameAndObjectApiName_ingestSuccess(
                luvio,
                childResourceParams,
                childResponse
            );
            if (childSnapshot.state === 'Stale') {
                snapshotState = 'Stale';
            }
            seenRecords = {
                ...seenRecords,
                ...childSnapshot.seenRecords,
                [childSnapshot.recordId]: true,
            };
            const childValue = {
                statusCode: 200,
                result: childSnapshot.data,
            };
            ObjectFreeze(childValue);
            ArrayPrototypePush.call(childSnapshotDataResponses, childValue);
        } else {
            const childStatusCodeText = getFetchResponseStatusText(result.statusCode);
            const childResponse: ResourceResponse<types_ListInfoRepresentation_ListInfoRepresentation> =
                {
                    status: childStatusCode,
                    body: childBody,
                    ok: false,
                    statusText: childStatusCodeText,
                    headers: {},
                };
            getUiApiListInfoByListViewApiNameAndObjectApiName_ingestError(
                luvio,
                childResourceParams,
                childResponse
            );
            seenRecords = {
                ...seenRecords,
                [childKey]: true,
            };
            const childValue = {
                statusCode: childStatusCode,
                result: childBody,
            };
            ObjectFreeze(childValue);
            ArrayPrototypePush.call(childSnapshotDataResponses, childValue);
        }

        // track non-cached responses so rebuilds work properly
        if (childStatusCode !== 404 && childStatusCode !== 200) {
            nonCachedErrors[childKey] = {
                expiration: now + types_ListInfoRepresentation_TTL,
                response: childBody,
                status: childStatusCode,
            };
        } else {
            delete nonCachedErrors[childKey];
        }
    }

    ObjectFreeze(childSnapshotDataResponses);
    const childSnapshotData: types_ListInfoBatchRepresentation_ListInfoBatchRepresentation = {
        results: childSnapshotDataResponses,
    };

    return { childSnapshotData: ObjectFreeze(childSnapshotData), seenRecords, snapshotState };
}

export function ingestSuccess(
    luvio: Luvio,
    resourceParams: ResourceRequestConfig,
    response: ResourceResponse<types_ListInfoBatchRepresentation_ListInfoBatchRepresentation>,
    snapshotRefresh?: SnapshotRefresh<types_ListInfoBatchRepresentation_ListInfoBatchRepresentation>
):
    | FulfilledSnapshot<types_ListInfoBatchRepresentation_ListInfoBatchRepresentation, any>
    | StaleSnapshot<types_ListInfoBatchRepresentation_ListInfoBatchRepresentation, any>
    | PendingSnapshot<types_ListInfoBatchRepresentation_ListInfoBatchRepresentation, any> {
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

    const key = keyBuilder(resourceParams);
    const { childSnapshotData, seenRecords, snapshotState } = ingestSuccessChildResourceParams(
        luvio,
        childResourceParamsArray,
        childEnvelopes
    );
    const syntheticSnapshot = {
        recordId: key,
        data: childSnapshotData,
        state: snapshotState,
        seenRecords: seenRecords,
        select: {
            recordId: key,
            node: select(luvio, resourceParams),
            variables: {},
        },
        refresh: snapshotRefresh,
        variables: {},
    } as
        | FulfilledSnapshot<types_ListInfoBatchRepresentation_ListInfoBatchRepresentation, any>
        | StaleSnapshot<types_ListInfoBatchRepresentation_ListInfoBatchRepresentation, any>
        | PendingSnapshot<types_ListInfoBatchRepresentation_ListInfoBatchRepresentation, any>;

    // evict top level composite record from the store. This covers the case where a previous resource request returned a 404.
    luvio.storeEvict(key);
    return syntheticSnapshot;
}

export function ingestError(
    luvio: Luvio,
    params: ResourceRequestConfig,
    error: FetchResponse<unknown>,
    snapshotRefresh?: SnapshotRefresh<types_ListInfoBatchRepresentation_ListInfoBatchRepresentation>
): ErrorSnapshot {
    const key = keyBuilder(params);
    const errorSnapshot = luvio.errorSnapshot(error, snapshotRefresh);
    luvio.storeIngestError(key, errorSnapshot);
    return errorSnapshot;
}

export function createResourceRequest(config: ResourceRequestConfig) {
    const headers: { [key: string]: string } = {};

    return {
        baseUri: '/services/data/v55.0',
        basePath: '/ui-api/list-info/batch',
        method: 'get',
        body: null,
        urlParams: {},
        queryParams: config.queryParams,
        headers,
    };
}

export default createResourceRequest;
