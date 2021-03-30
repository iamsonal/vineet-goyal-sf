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
    UnfulfilledSnapshot,
    AdapterContext,
} from '@luvio/engine';
import { untrustedIsObject } from '../../generated/adapters/adapter-utils';
import {
    GetListUiByApiNameConfig,
    getListUiByApiName_ConfigPropertyNames,
    validateAdapterConfig as getListUiByApiName_validateAdapterConfig,
} from '../../generated/adapters/getListUiByApiName';
import {
    GetListUiByListViewIdConfig,
    getListUiByListViewId_ConfigPropertyNames,
    validateAdapterConfig as getListUiByListViewId_validateAdapterConfig,
} from '../../generated/adapters/getListUiByListViewId';
import { GetListViewSummaryCollectionConfig } from '../../generated/adapters/getListViewSummaryCollection';
import { GetMruListUiConfig } from '../../generated/adapters/getMruListUi';
import getUiApiListRecordsByListViewId from '../../generated/resources/getUiApiListRecordsByListViewId';
import getUiApiListRecordsByObjectApiNameAndListViewApiName from '../../generated/resources/getUiApiListRecordsByListViewApiNameAndObjectApiName';
import getUiApiListUiByListViewId from '../../generated/resources/getUiApiListUiByListViewId';
import getUiApiListUiByObjectApiNameAndListViewApiName from '../../generated/resources/getUiApiListUiByListViewApiNameAndObjectApiName';
import { ListInfoRepresentation } from '../../generated/types/ListInfoRepresentation';
import {
    keyBuilder as ListRecordCollectionRepresentation_keyBuilder,
    ListRecordCollectionRepresentation,
    paginationKeyBuilder as ListRecordCollection_paginationKeyBuilder,
    ingest as types_ListRecordCollectionRepresentation_ingest,
} from '../../generated/types/ListRecordCollectionRepresentation';
import { select as ListReferenceRepresentation_select } from '../../generated/types/ListReferenceRepresentation';
import {
    keyBuilder as listUiRepresentation_keyBuilder,
    ListUiRepresentation,
    ingest as types_ListUiRepresentation_ingest,
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
    LIST_INFO_SELECTIONS,
    LIST_INFO_PRIVATES,
    isResultListInfoRepresentation,
} from '../../util/lists';
import {
    minimizeRequest,
    pathSelectionsFor,
    staticValuePathSelection,
} from '../../util/pagination';
import { factory as getListViewSummaryCollectionAdapterFactory } from '../getListViewSummaryCollection';
import { factory as getMruListUiAdapterFactory } from '../getMruListUi';
import { isUnfulfilledSnapshot, isFulfilledSnapshot } from '../../util/snapshot';

const LIST_REFERENCE_SELECTIONS = ListReferenceRepresentation_select();

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
    listInfo: ListInfoRepresentation,
    fields: ListFields
): Fragment {
    const defaultedConfig = { ...getServerDefaults(config, context), ...config };

    return {
        kind: 'Fragment',
        private: ['eTag'],
        selections: [
            {
                kind: 'Link',
                name: 'info',
                fragment: {
                    kind: 'Fragment',
                    private: LIST_INFO_PRIVATES,
                    selections: LIST_INFO_SELECTIONS,
                },
            },
            {
                kind: 'Link',
                name: 'records',
                fragment: {
                    kind: 'Fragment',
                    private: [],
                    selections: [
                        ...pathSelectionsFor({
                            name: 'records',
                            pageSize: defaultedConfig.pageSize || DEFAULT_PAGE_SIZE,
                            pageToken: defaultedConfig.pageToken,
                            private: ['eTag', 'weakEtag'],
                            selections: buildSelectionFromFields(
                                ...fields.getRecordSelectionFieldSets()
                            ),
                            tokenDataKey: ListRecordCollection_paginationKeyBuilder({
                                listViewId: listInfo.eTag,
                                sortBy:
                                    defaultedConfig.sortBy === undefined
                                        ? null
                                        : defaultedConfig.sortBy,
                            }),
                        }),
                        {
                            kind: 'Scalar',
                            name: 'fields',
                            plural: true,
                        },
                        {
                            kind: 'Scalar',
                            name: 'listInfoETag',
                        },
                        {
                            kind: 'Link',
                            name: 'listReference',
                            fragment: LIST_REFERENCE_SELECTIONS,
                        },
                        {
                            kind: 'Scalar',
                            name: 'optionalFields',
                            plural: true,
                        },
                        staticValuePathSelection({
                            name: 'pageSize',
                            value:
                                defaultedConfig.pageSize === undefined
                                    ? DEFAULT_PAGE_SIZE
                                    : defaultedConfig.pageSize,
                        }),
                        {
                            kind: 'Scalar',
                            name: 'sortBy',
                            plural: true,
                        },
                    ],
                },
            },
        ],
    };
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
        node: buildListUiFragment(config, context, listInfo, listFields_),
        variables: {},
    };

    return luvio.storeLookup<ListUiRepresentation>(
        selector,
        buildSnapshotRefresh(luvio, context, config)
    );
}

function buildSnapshotRefresh(
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
        request = getUiApiListUiByObjectApiNameAndListViewApiName({
            urlParams: {
                listViewApiName: config.listViewApiName,
                objectApiName: config.objectApiName,
            },
            queryParams,
        });
    } else if (isGetListUiByListViewIdConfig(config)) {
        request = getUiApiListUiByListViewId({
            urlParams: { listViewId: config.listViewId },
            queryParams,
        });
    } else {
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

    // response might have records.sortBy in csv format
    const sortBy = body.records.sortBy;
    if (sortBy && typeof sortBy === 'string') {
        body.records.sortBy = ((sortBy as unknown) as string).split(',');
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
    const fragment = buildListUiFragment(config, context, listInfo, fields);

    luvio.storeIngest(listUiKey, types_ListUiRepresentation_ingest, body);
    luvio.storeBroadcast();

    return luvio.storeLookup<ListUiRepresentation>(
        {
            recordId: listUiKey,
            node: fragment,
            variables: {},
        },
        buildSnapshotRefresh(luvio, context, config)
    );
}

function onResourceError_getListUi(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    err: FetchResponse<unknown>
) {
    return luvio.errorSnapshot(err, buildSnapshotRefresh(luvio, context, config));
}

function resolveUnfulfilledSnapshot_getListUi(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    snapshot: UnfulfilledSnapshot<ListUiRepresentation, any>
) {
    const request = prepareRequest_getListUi(config);
    return luvio.resolveUnfulfilledSnapshot<ListUiRepresentation>(request, snapshot).then(
        response => {
            return onResourceSuccess_getListUi(luvio, context, config, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResourceError_getListUi(luvio, context, config, err);
        }
    );
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
        response => {
            return onResourceSuccess_getListUi(luvio, context, config, response);
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
        body.sortBy = ((sortBy as unknown) as string).split(',');
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
    luvio.storeBroadcast();

    return buildInMemorySnapshot(luvio, context, config, listInfo, fields);
}

function onResourceError_getListRecords(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    listInfo: ListInfoRepresentation,
    err: FetchResponse<unknown>
) {
    luvio.storeIngestFetchResponse(
        listUiRepresentation_keyBuilder({
            ...listInfo.listReference,
            sortBy: getSortBy(config, context),
        }),
        err
    );
    luvio.storeBroadcast();
    return luvio.errorSnapshot(err);
}

function resolveUnfulfilledSnapshot_getListRecords(
    luvio: Luvio,
    context: AdapterContext,
    config: GetListUiConfig,
    listInfo: ListInfoRepresentation,
    snapshot: UnfulfilledSnapshot<ListUiRepresentation, any>
): Promise<Snapshot<ListUiRepresentation>> {
    const request = prepareRequest_getListRecords(luvio, context, config, listInfo, snapshot);

    return luvio
        .resolveUnfulfilledSnapshot<ListRecordCollectionRepresentation>(
            request,
            (snapshot as unknown) as UnfulfilledSnapshot<ListRecordCollectionRepresentation, any>
        )
        .then(
            response => {
                return onResourceSuccess_getListRecords(luvio, context, config, listInfo, response);
            },
            (err: FetchResponse<unknown>) => {
                return onResourceError_getListRecords(luvio, context, config, listInfo, err);
            }
        );
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
        response => {
            return onResourceSuccess_getListRecords(luvio, context, config, listInfo, response);
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

function validateGetListUiConfig(untrustedConfig: unknown): GetListUiConfig | null {
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

    // if the list ui was not found in the store then
    // make a full list-ui request
    if (!snapshot.data) {
        if (isUnfulfilledSnapshot(snapshot)) {
            return resolveUnfulfilledSnapshot_getListUi(luvio, context, config, snapshot);
        }

        return buildNetworkSnapshot_getListUi(luvio, context, config);
    }

    if (luvio.snapshotAvailable(snapshot)) {
        // cache hit :partyparrot:
        return snapshot;
    }

    // we *should* only be missing records and/or tokens at this point; send a list-records
    // request to fill them in
    if (isUnfulfilledSnapshot(snapshot)) {
        return resolveUnfulfilledSnapshot_getListRecords(
            luvio,
            context,
            config,
            listInfo,
            snapshot
        );
    }

    return buildNetworkSnapshot_getListRecords(luvio, context, config, listInfo, snapshot);
}

export const factory: AdapterFactory<
    | GetListViewSummaryCollectionConfig
    | GetListUiByApiNameConfig
    | GetListUiByListViewIdConfig
    | GetMruListUiConfig,
    ListUiRepresentation | ListViewSummaryCollectionRepresentation
> = (luvio: Luvio) => {
    // adapter implementation for getListUiBy*
    const listUiAdapter = (untrustedConfig: unknown, context: AdapterContext) => {
        const config = validateGetListUiConfig(untrustedConfig);

        if (config === null) {
            return null;
        }

        // try to get a list reference and a list info for the list; this should come back
        // non-null if we have the list info cached
        const listRef = getListReference(config, context);

        // no listRef means we can't even attempt to build an in-memory snapshot
        // so make a full list-ui request
        if (listRef === undefined) {
            return buildNetworkSnapshot_getListUi(luvio, context, config);
        }

        const listInfoSnapshot = getListInfo(listRef, luvio);

        // if we have list info then build a snapshot from that
        if (isFulfilledSnapshot(listInfoSnapshot)) {
            return getListUiSnapshotFromListInfo(luvio, context, config, listInfoSnapshot.data);
        }

        // if listInfoSnapshot is unfulfilled then we can try to resolve it
        if (isUnfulfilledSnapshot(listInfoSnapshot)) {
            const listUiResourceRequest = prepareRequest_getListUi(config);

            // In default environment resolving an unfulfilled snapshot is just hitting the network
            // with the given ResourceRequest (so list-ui in this case).  In durable environment
            // resolving an unfulfilled snapshot will first attempt to read the missing cache keys
            // from the given unfulfilled snapshot (a list-info snapshot in this case) and build a
            // fulfilled snapshot from that if those cache keys are present, otherwise it hits the
            // network with the given resource request.  Usually the ResourceRequest and the unfulfilled
            // snapshot are for the same response Type, but this lists adapter is special (it mixes
            // calls with list-info, list-records, and list-ui), and so our use of resolveUnfulfilledSnapshot
            // is special (polymorphic response, could either be a list-info representation or a
            // list-ui representation).
            return luvio.resolveUnfulfilledSnapshot(listUiResourceRequest, listInfoSnapshot).then(
                response => {
                    // if result came from cache we know it's a listinfo, otherwise
                    // it's a full list-ui response
                    if (isResultListInfoRepresentation(response)) {
                        return getListUiSnapshotFromListInfo(luvio, context, config, response.body);
                    } else {
                        return onResourceSuccess_getListUi(luvio, context, config, response);
                    }
                },
                (err: FetchResponse<unknown>) => {
                    return onResourceError_getListUi(luvio, context, config, err);
                }
            );
        }

        // if listInfoSnapshot in any other state then we make a full list-ui request
        return buildNetworkSnapshot_getListUi(luvio, context, config);
    };

    let listViewSummaryCollectionAdapter: Adapter<any, any> | null = null;
    let mruAdapter: Adapter<any, any> | null = null;

    // delegate to various other adapter based on what config looks like; note that the adapters
    // we delegate to are responsible for returning refreshable results
    return luvio.withContext(function UiApi__custom_getListUi(
        untrustedConfig: unknown,
        context: AdapterContext
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
                listViewSummaryCollectionAdapter = getListViewSummaryCollectionAdapterFactory(
                    luvio
                );
            }

            return listViewSummaryCollectionAdapter(untrustedConfig);
        }

        // see if config looks like a listViewId or listViewApiName request
        if (
            looksLikeGetListUiByApiNameConfig(untrustedConfig) ||
            looksLikeGetListUiByListViewIdConfig(untrustedConfig)
        ) {
            return listUiAdapter(untrustedConfig, context);
        }

        return null;
    });
};
