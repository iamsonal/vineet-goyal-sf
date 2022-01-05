import {
    Adapter,
    AdapterFactory,
    FetchResponse,
    Fragment,
    Luvio,
    ResourceRequest,
    Snapshot,
    SnapshotRefresh,
    ResourceResponse,
    AdapterContext,
    UnAvailableSnapshot,
    CacheKeySet,
    FulfilledSnapshot,
    AdapterRequestContext,
} from '@luvio/engine';
import { untrustedIsObject } from '../../generated/adapters/adapter-utils';
import {
    GetListUiByApiNameConfig,
    getListUiByApiName_ConfigPropertyNames,
    validateAdapterConfig as getListUiByApiName_validateAdapterConfig,
    createResourceParams as getListUiByApiName_createResourceParams,
} from '../../generated/adapters/getListUiByApiName';
import {
    GetListUiByListViewIdConfig,
    getListUiByListViewId_ConfigPropertyNames,
    validateAdapterConfig as getListUiByListViewId_validateAdapterConfig,
    createResourceParams as getListUiByListViewId_createResourceParams,
} from '../../generated/adapters/getListUiByListViewId';
import { GetListViewSummaryCollectionConfig } from '../../generated/adapters/getListViewSummaryCollection';
import { GetMruListUiConfig } from '../../generated/adapters/getMruListUi';
import getUiApiListRecordsByListViewId from '../../generated/resources/getUiApiListRecordsByListViewId';
import getUiApiListRecordsByObjectApiNameAndListViewApiName from '../../generated/resources/getUiApiListRecordsByListViewApiNameAndObjectApiName';

import {
    createResourceRequest as getUiApiListUiByObjectApiNameAndListViewApiName_createResourceRequest,
    createPaginationParams as getUiApiListUiByObjectApiNameAndListViewApiName_createPaginationParams,
} from '../../generated/resources/getUiApiListUiByListViewApiNameAndObjectApiName';
import {
    createResourceRequest as getUiApiListUiByListViewId_createResourceRequest,
    createPaginationParams as getUiApiListUiByListViewId_createPaginationParams,
} from '../../generated/resources/getUiApiListUiByListViewId';

import { ListInfoRepresentation } from '../../generated/types/ListInfoRepresentation';
import {
    DynamicSelectParams as types_ListRecordCollectionRepresentation_DynamicSelectParams,
    ListRecordCollectionRepresentation,
    keyBuilder as ListRecordCollectionRepresentation_keyBuilder,
    paginationKeyBuilder as ListRecordCollection_paginationKeyBuilder,
    ingest as types_ListRecordCollectionRepresentation_ingest,
    dynamicSelect as types_ListRecordCollectionRepresentation_dynamicSelect,
} from '../../generated/types/ListRecordCollectionRepresentation';
import {
    DynamicSelectParams as types_ListUiRepresentation_DynamicSelectParams,
    ListUiRepresentation,
    keyBuilder as listUiRepresentation_keyBuilder,
    ingest as types_ListUiRepresentation_ingest,
    dynamicSelect as types_ListUiRepresentation_dynamicSelect,
} from '../../generated/types/ListUiRepresentation';
import { ListViewSummaryCollectionRepresentation } from '../../generated/types/ListViewSummaryCollectionRepresentation';
import { buildSelectionFromFields } from '../../selectors/record';
import {
    addListReference,
    addServerDefaults,
    getListInfo,
    getListReference,
    getServerDefaults,
    listFields,
    ListFields,
    isListInfoSnapshotWithData,
} from '../../util/lists';
import { minimizeRequest } from '../../util/pagination';
import { isFulfilledSnapshot } from '../../util/snapshot';
import { ObjectKeys, ObjectFreeze } from '../../util/language';
import { isString } from '../../validation/utils';

import { factory as getListViewSummaryCollectionAdapterFactory } from '../getListViewSummaryCollection';
import { factory as getMruListUiAdapterFactory } from '../getMruListUi';

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO RAML - this more properly goes in the generated resource files
const DEFAULT_PAGE_SIZE = 50;

type GetListUiConfig = GetListUiByApiNameConfig | GetListUiByListViewIdConfig;

// make local copies of the adapter configs so we can have them ignore each other's config parameters
// to match lds222 behavior
const getListUiByApiName_ConfigPropertyNames_augmented = {
    ...getListUiByApiName_ConfigPropertyNames,
    parameters: {
        ...getListUiByApiName_ConfigPropertyNames.parameters,
        optional: [...getListUiByApiName_ConfigPropertyNames.parameters.optional, 'listViewId'],
    },
};

const getListUiByListViewId_ConfigPropertyNames_augmented = {
    ...getListUiByListViewId_ConfigPropertyNames,
    parameters: {
        ...getListUiByListViewId_ConfigPropertyNames.parameters,
        optional: [
            ...getListUiByListViewId_ConfigPropertyNames.parameters.optional,
            'listViewApiName',
            'objectApiName',
        ],
    },
};

function getSortBy(config: GetListUiConfig, context: AdapterContext): string[] | null {
    if (config.sortBy !== undefined) {
        return config.sortBy;
    }

    const defaults = getServerDefaults(config, context);

    if (defaults.sortBy !== undefined) {
        return defaults.sortBy;
    }

    return null;
}

function buildListUiFragment(
    config: GetListUiConfig,
    context: AdapterContext,
    fields: ListFields
): Fragment {
    const defaultedConfig = { ...getServerDefaults(config, context), ...config };

    let paginationParams;
    if (isGetListUiByListViewIdConfig(defaultedConfig)) {
        const resourceParams = getListUiByListViewId_createResourceParams(defaultedConfig);
        paginationParams = getUiApiListUiByListViewId_createPaginationParams(resourceParams);
    } else if (isGetListUiByApiNameConfig(defaultedConfig)) {
        const resourceParams = getListUiByApiName_createResourceParams(defaultedConfig);
        paginationParams =
            getUiApiListUiByObjectApiNameAndListViewApiName_createPaginationParams(resourceParams);
    }

    const recordSelectParams: types_ListRecordCollectionRepresentation_DynamicSelectParams = {
        records: {
            name: 'records',
            kind: 'Link',
            fragment: {
                kind: 'Fragment',
                private: ['eTag', 'weakEtag'],
                selections: buildSelectionFromFields(...fields.getRecordSelectionFieldSets()),
            },
        },
    };
    const listRecordCollectionSelect = types_ListRecordCollectionRepresentation_dynamicSelect(
        recordSelectParams,
        paginationParams
    );

    const listRecordCollectionSelectParams: types_ListUiRepresentation_DynamicSelectParams = {
        records: {
            name: 'records',
            kind: 'Link',
            fragment: listRecordCollectionSelect,
        },
    };
    return types_ListUiRepresentation_dynamicSelect(
        listRecordCollectionSelectParams,
        paginationParams
    );
}

function buildInMemorySnapshot(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    listInfo: ListInfoRepresentation,
    fields?: ListFields
): Snapshot<ListUiRepresentation> {
    const listUiKey = listUiRepresentation_keyBuilder({
        ...listInfo.listReference,
        sortBy: getSortBy(config, context),
    });
    const listFields_ = fields || listFields(luvio, config, listInfo);

    const selector = {
        recordId: listUiKey,
        node: buildListUiFragment(config, context, listFields_),
        variables: {},
    };

    return luvio.storeLookup<ListUiRepresentation>(
        selector,
        buildSnapshotRefresh_getListUi(luvio, context, config)
    );
}

function buildSnapshotRefresh_getListUi(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig
): SnapshotRefresh<ListUiRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot_getListUi(luvio, context, config),
    };
}

function prepareRequest_getListUi(config: GetListUiConfig) {
    const { fields, optionalFields, pageSize, pageToken, sortBy } = config;
    const queryParams = {
        fields,
        optionalFields,
        pageSize,
        pageToken,
        sortBy,
    };

    let request: ResourceRequest;
    if (isGetListUiByApiNameConfig(config)) {
        request = getUiApiListUiByObjectApiNameAndListViewApiName_createResourceRequest({
            urlParams: {
                listViewApiName: config.listViewApiName,
                objectApiName: config.objectApiName,
            },
            queryParams,
        });
    } else if (isGetListUiByListViewIdConfig(config)) {
        request = getUiApiListUiByListViewId_createResourceRequest({
            urlParams: { listViewId: config.listViewId },
            queryParams,
        });
    } else {
        // eslint-disable-next-line @salesforce/lds/no-error-in-production
        throw new Error('unrecognized config');
    }

    return request;
}

function getResponseCacheKeys_getListUi(
    luvio: Luvio,
    response: FetchResponse<ListUiRepresentation>
): CacheKeySet {
    // TODO [W-10055997]: make this more efficient

    // for now we will get the cache keys by actually ingesting then looking at
    // the store records

    // ingest mutates the response so we have to make a copy
    const responseCopy = JSON.parse(JSON.stringify(response));
    const { body } = responseCopy,
        listInfo = body.info,
        { listReference } = listInfo;

    // response might have records.sortBy in csv format
    const sortBy = body.records.sortBy;
    if (isString(sortBy)) {
        body.records.sortBy = ObjectFreeze(sortBy.split(','));
    }

    const listUiKey = listUiRepresentation_keyBuilder({
        ...listReference,
        sortBy: body.records.sortBy,
    });

    luvio.storeIngest(listUiKey, types_ListUiRepresentation_ingest, body);

    const visited = ObjectKeys((luvio as any).environment.store.visitedIds);

    const keys: CacheKeySet = {};
    for (let i = 0, len = visited.length; i < len; i++) {
        const key = visited[i];
        const namespace = key.split('::')[0];
        const representationName = key.split('::')[1].split(':')[0];
        keys[key] = {
            namespace,
            representationName,
        };
    }

    return keys;
}

function getResponseCacheKeys_getListRecords(
    luvio: Luvio,
    listInfo: ListInfoRepresentation,
    response: ResourceResponse<ListRecordCollectionRepresentation>
) {
    // TODO [W-10055997]: make this more efficient

    // for now we will get the cache keys by actually ingesting then looking at
    // the store records

    // ingest mutates the response so we have to make a copy
    const responseCopy = JSON.parse(JSON.stringify(response));
    const { body } = responseCopy;
    const { listInfoETag } = body;

    // bail early if list view has changed
    if (listInfoETag !== listInfo.eTag) {
        return {};
    }

    // response might have records.sortBy in csv format
    const { sortBy } = body;
    if (sortBy && typeof sortBy === 'string') {
        body.sortBy = (sortBy as unknown as string).split(',');
    }

    luvio.storeIngest(
        ListRecordCollectionRepresentation_keyBuilder({
            listViewId: listInfoETag,
            sortBy: body.sortBy,
        }),
        types_ListRecordCollectionRepresentation_ingest,
        body
    );

    const visited = ObjectKeys((luvio as any).environment.store.visitedIds);

    const keys: CacheKeySet = {};
    for (let i = 0, len = visited.length; i < len; i++) {
        const key = visited[i];
        const namespace = key.split('::')[0];
        const representationName = key.split('::')[1].split(':')[0];
        keys[key] = {
            namespace,
            representationName,
        };
    }

    return keys;
}

function onResourceSuccess_getListUi(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    response: ResourceResponse<ListUiRepresentation>
) {
    const { body } = response,
        listInfo = body.info,
        { listReference } = listInfo;

    // response might have records.sortBy in csv format
    const sortBy = body.records.sortBy;
    if (sortBy && typeof sortBy === 'string') {
        body.records.sortBy = (sortBy as unknown as string).split(',');
    }

    const listUiKey = listUiRepresentation_keyBuilder({
        ...listReference,
        sortBy: body.records.sortBy,
    });

    // grab relevant bits before ingest destroys the structure
    const fields = listFields(luvio, config, listInfo);
    fields.processRecords(body.records.records);

    // remember the id/name of this list
    addListReference(listReference, context);

    // remember any default values that the server filled in
    addServerDefaults(config, body, context);

    // build the selector while the list info is still easily accessible
    const fragment = buildListUiFragment(config, context, fields);

    luvio.storeIngest(listUiKey, types_ListUiRepresentation_ingest, body);

    const snapshot = luvio.storeLookup<ListUiRepresentation>(
        {
            recordId: listUiKey,
            node: fragment,
            variables: {},
        },
        buildSnapshotRefresh_getListUi(luvio, context, config)
    );

    luvio.storeBroadcast();

    return snapshot;
}

function onResourceError_getListUi(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    err: FetchResponse<unknown>
) {
    return luvio.errorSnapshot(err, buildSnapshotRefresh_getListUi(luvio, context, config));
}

/**
 * Builds, sends, and processes the result of a list-ui request, ignoring any cached
 * data for the list view.
 *
 * @param luvio Luvio engine
 * @param config wire config
 */
function buildNetworkSnapshot_getListUi(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig
): Promise<Snapshot<ListUiRepresentation>> {
    const request = prepareRequest_getListUi(config);

    return luvio.dispatchResourceRequest<ListUiRepresentation>(request).then(
        (response) => {
            return luvio.handleSuccessResponse(
                () => onResourceSuccess_getListUi(luvio, context, config, response),
                () => getResponseCacheKeys_getListUi(luvio, response)
            );
        },
        (err: FetchResponse<unknown>) => {
            return onResourceError_getListUi(luvio, context, config, err);
        }
    );
}

function prepareRequest_getListRecords(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    listInfo: ListInfoRepresentation,
    snapshot?: Snapshot<ListUiRepresentation>
) {
    const { fields, optionalFields, pageSize, pageToken, sortBy } = config;
    const queryParams = {
        fields,
        optionalFields,
        pageSize,
        pageToken,
        sortBy,
    };

    let request: ResourceRequest;
    if (isGetListUiByApiNameConfig(config)) {
        request = getUiApiListRecordsByObjectApiNameAndListViewApiName({
            urlParams: {
                listViewApiName: config.listViewApiName,
                objectApiName: config.objectApiName,
            },
            queryParams,
        });
    } else if (isGetListUiByListViewIdConfig(config)) {
        request = getUiApiListRecordsByListViewId({
            urlParams: { listViewId: config.listViewId },
            queryParams,
        });
    } else {
        // eslint-disable-next-line @salesforce/lds/no-error-in-production
        throw new Error('how did MRU config get here?');
    }

    if (snapshot) {
        // compute the minimum number of records we need to request
        const { pageSize, pageToken } = minimizeRequest({
            data: snapshot.data ? snapshot.data.records : null,
            name: 'records',
            pageSize: config.pageSize || DEFAULT_PAGE_SIZE,
            pageToken: config.pageToken,
            pagination: luvio.pagination(
                ListRecordCollection_paginationKeyBuilder({
                    listViewId: listInfo.eTag,
                    sortBy: getSortBy(config, context),
                })
            ),
        });

        // update request, but don't harden default values unless they were already present
        if (pageSize !== DEFAULT_PAGE_SIZE || request.queryParams.pageSize !== undefined) {
            request.queryParams.pageSize = pageSize;
        }
        if (pageToken || request.queryParams.pageToken !== undefined) {
            request.queryParams.pageToken = pageToken;
        }
    }

    return request;
}

function onResourceSuccess_getListRecords(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    listInfo: ListInfoRepresentation,
    response: ResourceResponse<ListRecordCollectionRepresentation>
) {
    const { body } = response;
    const { listInfoETag } = body;

    // fall back to list-ui if list view has changed
    if (listInfoETag !== listInfo.eTag) {
        return buildNetworkSnapshot_getListUi(luvio, context, config);
    }

    // response might have records.sortBy in csv format
    const { sortBy } = body;
    if (sortBy && typeof sortBy === 'string') {
        body.sortBy = (sortBy as unknown as string).split(',');
    }

    const fields = listFields(luvio, config, listInfo).processRecords(body.records);

    luvio.storeIngest(
        ListRecordCollectionRepresentation_keyBuilder({
            listViewId: listInfoETag,
            sortBy: body.sortBy,
        }),
        types_ListRecordCollectionRepresentation_ingest,
        body
    );

    const snapshot = buildInMemorySnapshot(luvio, context, config, listInfo, fields);
    luvio.storeBroadcast();
    return snapshot;
}

function onResourceError_getListRecords(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    listInfo: ListInfoRepresentation,
    err: FetchResponse<unknown>
) {
    const errorSnapshot = luvio.errorSnapshot(err);
    luvio.storeIngestError(
        listUiRepresentation_keyBuilder({
            ...listInfo.listReference,
            sortBy: getSortBy(config, context),
        }),
        errorSnapshot
    );
    luvio.storeBroadcast();
    return errorSnapshot;
}

function buildNetworkSnapshot_getListRecords(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    listInfo: ListInfoRepresentation,
    snapshot?: Snapshot<ListUiRepresentation>
): Promise<Snapshot<ListUiRepresentation>> {
    const request = prepareRequest_getListRecords(luvio, context, config, listInfo, snapshot);

    return luvio.dispatchResourceRequest<ListRecordCollectionRepresentation>(request).then(
        (response) => {
            return luvio.handleSuccessResponse(
                () =>
                    onResourceSuccess_getListRecords(
                        luvio,
                        context,
                        config,
                        listInfo,
                        response
                    ) as FulfilledSnapshot<ListUiRepresentation, unknown>,
                () => getResponseCacheKeys_getListRecords(luvio, listInfo, response)
            );
        },
        (err: FetchResponse<unknown>) => {
            return onResourceError_getListRecords(luvio, context, config, listInfo, err);
        }
    );
}

// functions to discern config variations

function isGetListUiByApiNameConfig(config: GetListUiConfig): config is GetListUiByApiNameConfig {
    return (config as GetListUiByApiNameConfig).listViewApiName !== undefined;
}

function looksLikeGetListUiByApiNameConfig(untrustedConfig: unknown) {
    return (
        untrustedIsObject<GetListUiByApiNameConfig>(untrustedConfig) &&
        untrustedConfig.objectApiName &&
        untrustedConfig.listViewApiName
    );
}

function isGetListUiByListViewIdConfig(
    config: GetListUiConfig
): config is GetListUiByListViewIdConfig {
    return !!(config as GetListUiByListViewIdConfig).listViewId;
}

function looksLikeGetListUiByListViewIdConfig(untrustedConfig: unknown) {
    return (
        untrustedIsObject<GetListUiByListViewIdConfig>(untrustedConfig) &&
        untrustedConfig.listViewId
    );
}

function looksLikeGetListViewSummaryCollectionConfig(untrustedConfig: unknown) {
    return (
        untrustedIsObject<GetListViewSummaryCollectionConfig>(untrustedConfig) &&
        untrustedConfig.objectApiName &&
        !(untrustedConfig as GetListUiByListViewIdConfig).listViewId &&
        !(untrustedConfig as GetListUiByApiNameConfig).listViewApiName
    );
}

function looksLikeGetMruListUiConfig(
    untrustedConfig: unknown
): untrustedConfig is { listViewApiName: typeof MRU } {
    // the MRU symbol is a carryover hack from 222 and doesn't show up in any
    // of the generated config types, so we cast to any in order to check for it
    return untrustedIsObject(untrustedConfig) && (untrustedConfig as any).listViewApiName === MRU;
}

export function validateGetListUiConfig(untrustedConfig: unknown): GetListUiConfig | null {
    return looksLikeGetListUiByApiNameConfig(untrustedConfig)
        ? getListUiByApiName_validateAdapterConfig(
              untrustedConfig,
              getListUiByApiName_ConfigPropertyNames_augmented
          )
        : looksLikeGetListUiByListViewIdConfig(untrustedConfig)
        ? getListUiByListViewId_validateAdapterConfig(
              untrustedConfig,
              getListUiByListViewId_ConfigPropertyNames_augmented
          )
        : null;
}

// the listViewApiName value to pass to getListUi() to request the MRU list
export const MRU = Symbol.for('MRU');

function getListUiSnapshotFromListInfo(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    listInfo: ListInfoRepresentation
) {
    // with the list info we can construct the full selector and try to get the
    // list ui from the store
    const snapshot = buildInMemorySnapshot(luvio, context, config, listInfo);

    if (luvio.snapshotAvailable(snapshot)) {
        // cache hit :partyparrot:
        return snapshot;
    }

    // if the list ui was not found in the store then
    // make a full list-ui request
    if (!snapshot.data) {
        return luvio.resolveSnapshot(
            snapshot,
            buildSnapshotRefresh_getListUi(luvio, context, config)
        );
    }

    // we *should* only be missing records and/or tokens at this point; send a list-records
    // request to fill them in
    return luvio.resolveSnapshot(snapshot, {
        config,
        resolve: () =>
            buildNetworkSnapshot_getListRecords(luvio, context, config, listInfo, snapshot),
    });
}

export const factory: AdapterFactory<
    | GetListViewSummaryCollectionConfig
    | GetListUiByApiNameConfig
    | GetListUiByListViewIdConfig
    | GetMruListUiConfig,
    ListUiRepresentation | ListViewSummaryCollectionRepresentation
> = (luvio: Luvio) => {
    // adapter implementation for getListUiBy*
    const listUiAdapter = (untrustedConfig: unknown, adapterContext: AdapterContext) => {
        const config = validateGetListUiConfig(untrustedConfig);

        if (config === null) {
            return null;
        }

        // try to get a list reference and a list info for the list; this should come back
        // non-null if we have the list info cached
        const listRef = getListReference(config, adapterContext);

        // no listRef means we can't even attempt to build an in-memory snapshot
        // so make a full list-ui request
        if (listRef === undefined) {
            // TODO [W-9712566]: this is returning network response directly to caller,
            // this means LDS on Mobile environment does not have a chance to overlay
            // draft edits on top of results
            return buildNetworkSnapshot_getListUi(luvio, adapterContext, config);
        }

        const listInfoSnapshot = getListInfo(listRef, luvio);

        // if we have list info then build a snapshot from that
        if (isFulfilledSnapshot(listInfoSnapshot)) {
            return getListUiSnapshotFromListInfo(
                luvio,
                adapterContext,
                config,
                listInfoSnapshot.data
            );
        }

        // In default environment resolving a snapshot is just hitting the network
        // using the given SnapshotRefresh (so list-ui in this case).  In durable environment
        // resolving a snapshot will first attempt to read the missing cache keys
        // from the given UnAvailable snapshot (a list-info snapshot in this case) and build a
        // fulfilled snapshot from that if those cache keys are present, otherwise it refreshes
        // with the given SnapshotRefresh.  Usually the SnapshotRefresh response and the UnAvailable
        // snapshot are for the same response Type, but this lists adapter is special (it mixes
        // calls with list-info, list-records, and list-ui), and so our use of resolveSnapshot
        // is special (polymorphic response, could either be a list-info representation or a
        // list-ui representation).
        return luvio
            .resolveSnapshot(
                listInfoSnapshot as UnAvailableSnapshot<ListInfoRepresentation>,
                buildSnapshotRefresh_getListUi(
                    luvio,
                    adapterContext,
                    config
                ) as unknown as SnapshotRefresh<ListInfoRepresentation>
            )
            .then((resolvedSnapshot) => {
                // if result came from cache we know it's a listinfo, otherwise
                // it's a full list-ui response
                if (isListInfoSnapshotWithData(resolvedSnapshot)) {
                    return getListUiSnapshotFromListInfo(
                        luvio,
                        adapterContext,
                        config,
                        resolvedSnapshot.data
                    );
                }

                return resolvedSnapshot as Snapshot<ListUiRepresentation>;
            });
    };

    let listViewSummaryCollectionAdapter: Adapter<any, any> | null = null;
    let mruAdapter: Adapter<any, any> | null = null;

    // delegate to various other adapter based on what config looks like; note that the adapters
    // we delegate to are responsible for returning refreshable results
    return luvio.withContext(function UiApi__custom_getListUi(
        untrustedConfig: unknown,
        adapterContext: AdapterContext,
        requestContext?: AdapterRequestContext
    ) {
        // if the MRU symbol is there then just return the getMruListUi adapter
        if (looksLikeGetMruListUiConfig(untrustedConfig)) {
            if (mruAdapter === null) {
                mruAdapter = getMruListUiAdapterFactory(luvio);
            }

            // the symbol in the listViewApiName is just a hack so we can recognize the request as MRU
            const mruConfig: any = { ...untrustedConfig };
            delete mruConfig.listViewApiName;

            return mruAdapter(mruConfig);
        }

        // if config has objectApiName but no listViewId or listViewApiName then hand off
        // to listViewSummaryCollectionAdapter
        if (looksLikeGetListViewSummaryCollectionConfig(untrustedConfig)) {
            if (listViewSummaryCollectionAdapter === null) {
                listViewSummaryCollectionAdapter =
                    getListViewSummaryCollectionAdapterFactory(luvio);
            }

            return listViewSummaryCollectionAdapter(untrustedConfig, requestContext);
        }

        // see if config looks like a listViewId or listViewApiName request
        if (
            looksLikeGetListUiByApiNameConfig(untrustedConfig) ||
            looksLikeGetListUiByListViewIdConfig(untrustedConfig)
        ) {
            return listUiAdapter(untrustedConfig, adapterContext);
        }

        return null;
    });
};
