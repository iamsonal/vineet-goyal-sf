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
    AdapterRequestContext,
    StoreLookup,
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
    keyBuilderFromType as ListRecordCollectionRepresentation_keyBuilderFromType,
    paginationKeyBuilder as ListRecordCollection_paginationKeyBuilder,
    ingest as types_ListRecordCollectionRepresentation_ingest,
    dynamicSelect as types_ListRecordCollectionRepresentation_dynamicSelect,
    getTypeCacheKeys as types_ListRecordCollectionRepresentation_getTypeCacheKeys,
} from '../../generated/types/ListRecordCollectionRepresentation';
import {
    DynamicSelectParams as types_ListUiRepresentation_DynamicSelectParams,
    ListUiRepresentation,
    keyBuilder as listUiRepresentation_keyBuilder,
    keyBuilderFromType as listUiRepresentation_keyBuilderFromType,
    ingest as types_ListUiRepresentation_ingest,
    dynamicSelect as types_ListUiRepresentation_dynamicSelect,
    getTypeCacheKeys as types_ListUiRepresentation_getTypeCacheKeys,
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
} from '../../util/lists';
import { minimizeRequest } from '../../util/pagination';
import { isFulfilledSnapshot, isStaleSnapshot } from '../../util/snapshot';

import { factory as getListViewSummaryCollectionAdapterFactory } from '../getListViewSummaryCollection';
import { factory as getMruListUiAdapterFactory } from '../getMruListUi';
import { buildNotFetchableNetworkSnapshot } from '../../util/cache-policy';
import { isPromise } from '../../util/promise';

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

function buildCachedSnapshot(
    luvio: Luvio,
    storeLookup: StoreLookup<ListUiRepresentation>,
    context: AdapterContext,
    config: GetListUiConfig,
    listInfo: ListInfoRepresentation,
    fields?: ListFields
): Snapshot<ListUiRepresentation> {
    const listUiKey = listUiRepresentation_keyBuilder({
        ...listInfo.listReference,
        sortBy: getSortBy(config, context),
    });
    // ok to pass luvio here since listFields() ignores TTL when getting cached field information
    const listFields_ = fields || listFields(luvio, config, listInfo);

    const selector = {
        recordId: listUiKey,
        node: buildListUiFragment(config, context, listFields_),
        variables: {},
    };

    return storeLookup(selector, buildSnapshotRefresh_getListUi(luvio, context, config));
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

function onResourceSuccess_getListUi(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    response: ResourceResponse<ListUiRepresentation>
) {
    const { body } = response,
        listInfo = body.info,
        { listReference } = listInfo;

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
            const { body } = response;

            // response might have records.sortBy in csv format but keyBuilder/ingestion
            // functions expect it to be an array so coerce it here if needed
            const sortBy = body.records.sortBy;
            if (sortBy && typeof sortBy === 'string') {
                body.records.sortBy = (sortBy as unknown as string).split(',');
            }

            return luvio.handleSuccessResponse(
                () => onResourceSuccess_getListUi(luvio, context, config, response),
                () =>
                    types_ListUiRepresentation_getTypeCacheKeys(body, () =>
                        listUiRepresentation_keyBuilderFromType(body)
                    )
            );
        },
        (err: FetchResponse<unknown>) => {
            return luvio.handleErrorResponse(() => {
                return onResourceError_getListUi(luvio, context, config, err);
            });
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

// Only call this function if you are certain the list view hasn't changed (ie:
// the listInfoEtag in the body is the same as the cached listInfo.eTag)
function onResourceSuccess_getListRecords(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    listInfo: ListInfoRepresentation,
    response: ResourceResponse<ListRecordCollectionRepresentation>
): Snapshot<ListUiRepresentation> {
    const { body } = response;
    const { listInfoETag } = body;

    const fields = listFields(luvio, config, listInfo).processRecords(body.records);

    luvio.storeIngest(
        ListRecordCollectionRepresentation_keyBuilder({
            listViewId: listInfoETag,
            sortBy: body.sortBy,
        }),
        types_ListRecordCollectionRepresentation_ingest,
        body
    );

    const snapshot = buildCachedSnapshot(
        luvio,
        luvio.storeLookup.bind(luvio),
        context,
        config,
        listInfo,
        fields
    );
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
            const { body } = response;

            // fall back to list-ui if list view has changed
            if (body.listInfoETag !== listInfo.eTag) {
                return buildNetworkSnapshot_getListUi(luvio, context, config);
            }

            // response might have records.sortBy in csv format but keyBuilder/ingestion
            // functions expect it to be an array so coerce it here if needed
            const { sortBy } = body;
            if (sortBy && typeof sortBy === 'string') {
                body.sortBy = (sortBy as unknown as string).split(',');
            }

            // else ingest
            return luvio.handleSuccessResponse(
                () => onResourceSuccess_getListRecords(luvio, context, config, listInfo, response),
                () =>
                    types_ListRecordCollectionRepresentation_getTypeCacheKeys(body, () =>
                        ListRecordCollectionRepresentation_keyBuilderFromType(body)
                    )
            );
        },
        (err: FetchResponse<unknown>) => {
            return luvio.handleErrorResponse(() => {
                return onResourceError_getListRecords(luvio, context, config, listInfo, err);
            });
        }
    );
}

// functions to retrieve a ListInfoRepresentation

type BuildListInfoSnapshotContext = {
    adapterContext: AdapterContext;
    config: GetListUiConfig;
    luvio: Luvio;
};

function buildCachedListInfoSnapshot(
    context: BuildListInfoSnapshotContext,
    storeLookup: StoreLookup<ListInfoRepresentation>
): Snapshot<ListInfoRepresentation> | undefined {
    const { adapterContext, config } = context;

    // try to get a list reference and a list info for the list; this should come back
    // non-null if we have the list info cached
    const listRef = getListReference(config, adapterContext);

    // no listRef means we can't even attempt to build a cached snapshot
    // so make a full list-ui request
    if (listRef === undefined) {
        return;
    }

    return getListInfo(listRef, storeLookup);
}

// functions to retrieve a ListUiRepresentation

type BuildListUiSnapshotContext = {
    adapterContext: AdapterContext;
    config: GetListUiConfig;
    listInfo: ListInfoRepresentation | undefined;
    listUi?: Snapshot<ListUiRepresentation>;
    luvio: Luvio;
};

function buildCachedListUiSnapshot(
    context: BuildListUiSnapshotContext,
    storeLookup: StoreLookup<ListUiRepresentation>
): Snapshot<ListUiRepresentation> | undefined {
    const { adapterContext, config, listInfo, luvio } = context;

    if (listInfo !== undefined) {
        context.listUi = buildCachedSnapshot(luvio, storeLookup, adapterContext, config, listInfo);
        return context.listUi;
    }
}

function buildNetworkListUiSnapshot(
    context: BuildListUiSnapshotContext
): Promise<Snapshot<ListUiRepresentation>> {
    const { adapterContext, config, listInfo, listUi, luvio } = context;

    // make the full list ui request if any of the following is true:
    //
    // - the list info was not found
    // - we couldn't build enough of the list ui to locate any record data
    // - we found the complete cached list ui; this is somewhat counterintuitive,
    //   but it happens when the cache policy has decided to refetch cached data
    if (
        !listInfo ||
        !listUi ||
        !listUi.data ||
        isFulfilledSnapshot(listUi) ||
        isStaleSnapshot(listUi)
    ) {
        return buildNetworkSnapshot_getListUi(luvio, adapterContext, config);
    }

    // we *should* only be missing records and/or tokens at this point; send a list-records
    // request to fill them in
    return buildNetworkSnapshot_getListRecords(luvio, adapterContext, config, listInfo, listUi);
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

export const factory: AdapterFactory<
    | GetListViewSummaryCollectionConfig
    | GetListUiByApiNameConfig
    | GetListUiByListViewIdConfig
    | GetMruListUiConfig,
    ListUiRepresentation | ListViewSummaryCollectionRepresentation
> = (luvio: Luvio) => {
    // adapter implementation for getListUiBy*
    const listUiAdapter = (
        untrustedConfig: unknown,
        adapterContext: AdapterContext,
        requestContext?: AdapterRequestContext
    ) => {
        const config = validateGetListUiConfig(untrustedConfig);

        if (config === null) {
            return null;
        }

        const definedRequestContext = requestContext || {};

        // try to find a cached ListInfoRepresentation
        const listInfoPromiseOrSnapshot = luvio.applyCachePolicy(
            definedRequestContext,
            { adapterContext, config, luvio },
            buildCachedListInfoSnapshot,
            buildNotFetchableNetworkSnapshot(luvio)
        );

        // build the ListUiRepresentation from the cached ListInfoRepresentation (if any)
        const processListInfo = (listInfoSnapshot: Snapshot<ListInfoRepresentation>) => {
            const listInfo =
                isFulfilledSnapshot(listInfoSnapshot) || isStaleSnapshot(listInfoSnapshot)
                    ? listInfoSnapshot.data
                    : undefined;

            return luvio.applyCachePolicy(
                definedRequestContext,
                { adapterContext, config, listInfo, luvio },
                buildCachedListUiSnapshot,
                buildNetworkListUiSnapshot
            );
        };

        return isPromise(listInfoPromiseOrSnapshot)
            ? listInfoPromiseOrSnapshot.then(processListInfo)
            : processListInfo(listInfoPromiseOrSnapshot);
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

            return mruAdapter(mruConfig, requestContext);
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
            return listUiAdapter(untrustedConfig, adapterContext, requestContext);
        }

        return null;
    });
};
