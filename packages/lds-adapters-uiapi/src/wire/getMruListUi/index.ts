import type {
    AdapterFactory,
    Fragment,
    Luvio,
    Selector,
    Snapshot,
    FetchResponse,
    SnapshotRefresh,
    ResourceResponse,
    AdapterRequestContext,
    StoreLookup,
} from '@luvio/engine';
import type { GetMruListUiConfig } from '../../generated/adapters/getMruListUi';
import {
    getMruListUi_ConfigPropertyNames,
    validateAdapterConfig,
    createResourceParams,
} from '../../generated/adapters/getMruListUi';
import createMruListRecordsResourceRequest from '../../generated/resources/getUiApiMruListRecordsByObjectApiName';
import {
    createResourceRequest as createMruListUiResourceRequest,
    createPaginationParams as getUiApiMruListUiByObjectApiName_createPaginationParams,
    keyBuilder,
} from '../../generated/resources/getUiApiMruListUiByObjectApiName';
import type { ListInfoRepresentation } from '../../generated/types/ListInfoRepresentation';
import { createResourceParams as createMruListUiResourceParams } from '../../generated/adapters/getMruListUi';
import type {
    DynamicSelectParams as types_ListRecordCollectionRepresentation_DynamicSelectParams,
    ListRecordCollectionRepresentation,
} from '../../generated/types/ListRecordCollectionRepresentation';
import {
    keyBuilder as ListRecordCollectionRepresentation_keyBuilder,
    keyBuilderFromType as ListRecordCollectionRepresentation_keyBuilderFromType,
    paginationKeyBuilder as ListRecordCollection_paginationKeyBuilder,
    ingest as types_ListRecordCollectionRepresentation_ingest,
    dynamicSelect as types_ListRecordCollectionRepresentation_dynamicSelect,
    getTypeCacheKeys as types_ListRecordCollectionRepresentation_getTypeCacheKeys,
} from '../../generated/types/ListRecordCollectionRepresentation';
import type {
    DynamicSelectParams as types_ListUiRepresentation_DynamicSelectParams,
    ListUiRepresentation,
} from '../../generated/types/ListUiRepresentation';
import {
    keyBuilder as listUiRepresentation_keyBuilder,
    keyBuilderFromType as listUiRepresentation_keyBuilderFromType,
    ingest as types_ListUiRepresentation_ingest,
    dynamicSelect as types_ListUiRepresentation_dynamicSelect,
    getTypeCacheKeys as types_ListUiRepresentation_getTypeCacheKeys,
} from '../../generated/types/ListUiRepresentation';
import { buildSelectionFromFields } from '../../selectors/record';
import type { ListFields } from '../../util/lists';
import { getListInfo, listFields } from '../../util/lists';
import { minimizeRequest } from '../../util/pagination';
import { isFulfilledSnapshot, isStaleSnapshot } from '../../util/snapshot';
import { buildNotFetchableNetworkSnapshot } from '../../util/cache-policy';
import { isPromise } from '../../util/promise';

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO RAML - this more properly goes in the generated resource files
const DEFAULT_PAGE_SIZE = 50;

// make local copies of the adapter configs so we can ignore other getListUi config parameters to match
// lds222 behavior
const getMruListUi_ConfigPropertyNames_augmented = {
    ...getMruListUi_ConfigPropertyNames,
    parameters: {
        ...getMruListUi_ConfigPropertyNames.parameters,
        optional: [
            ...getMruListUi_ConfigPropertyNames.parameters.optional,
            'listViewApiName',
            'listViewId',
        ],
    },
};

function buildListUiFragment(config: GetMruListUiConfig, fields: ListFields): Fragment {
    const resourceParams = createResourceParams(config);
    const paginationParams =
        getUiApiMruListUiByObjectApiName_createPaginationParams(resourceParams);

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

function buildSnapshotRefresh_getMruListUi(
    luvio: Luvio,
    config: GetMruListUiConfig
): SnapshotRefresh<ListUiRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot_getMruListUi(luvio, config),
    };
}

function onResourceSuccess_getMruListUi(
    luvio: Luvio,
    config: GetMruListUiConfig,
    response: ResourceResponse<ListUiRepresentation>
) {
    const { body } = response;
    const listInfo = body.info;

    const listUiKey = listUiRepresentation_keyBuilder({
        ...listInfo.listReference,
        sortBy: body.records.sortBy,
    });

    // grab relevant bits before ingest destroys the structure
    const fields = listFields(luvio, config, listInfo);
    fields.processRecords(body.records.records);

    // build the selector while the list info is still easily accessible
    const fragment = buildListUiFragment(config, fields);

    luvio.storeIngest(listUiKey, types_ListUiRepresentation_ingest, body);

    const snapshot = luvio.storeLookup<ListUiRepresentation>(
        {
            recordId: listUiKey,
            node: fragment,
            variables: {},
        },
        buildSnapshotRefresh_getMruListUi(luvio, config)
    );

    luvio.storeBroadcast();

    return snapshot;
}

function onResourceError_getMruListUi(
    luvio: Luvio,
    config: GetMruListUiConfig,
    err: FetchResponse<unknown>
) {
    return luvio.errorSnapshot(err, buildSnapshotRefresh_getMruListUi(luvio, config));
}

export function buildCachedSnapshot(
    luvio: Luvio,
    storeLookup: StoreLookup<ListUiRepresentation>,
    config: GetMruListUiConfig,
    listInfo: ListInfoRepresentation,
    fields?: ListFields
): Snapshot<ListUiRepresentation> {
    const listFields_ = fields || listFields(luvio, config, listInfo);
    const resourceParams = createMruListUiResourceParams(config);
    const selector: Selector = {
        recordId: keyBuilder(resourceParams),
        node: buildListUiFragment(config, listFields_),
        variables: {},
    };

    return storeLookup(selector, buildSnapshotRefresh_getMruListUi(luvio, config));
}

/**
 * Builds, sends, and processes the result of a mru-list-ui request, ignoring any cached
 * data for the list.
 *
 * @param luvio Luvio engine
 * @param config wire config
 */
function buildNetworkSnapshot_getMruListUi(
    luvio: Luvio,
    config: GetMruListUiConfig
): Promise<Snapshot<ListUiRepresentation>> {
    const params = createMruListUiResourceParams(config);
    const request = createMruListUiResourceRequest(params);

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
                () => onResourceSuccess_getMruListUi(luvio, config, response),
                () =>
                    types_ListUiRepresentation_getTypeCacheKeys(body, () =>
                        listUiRepresentation_keyBuilderFromType(body)
                    )
            );
        },
        (err: FetchResponse<unknown>) => {
            return luvio.handleErrorResponse(() =>
                onResourceError_getMruListUi(luvio, config, err)
            );
        }
    );
}

function prepareRequest_getMruListRecords(
    luvio: Luvio,
    config: GetMruListUiConfig,
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

    const request = createMruListRecordsResourceRequest({
        urlParams: {
            objectApiName: config.objectApiName,
        },
        queryParams,
    });

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
                    sortBy: config.sortBy === undefined ? null : config.sortBy,
                })
            ),
        });

        // update request, but don't harden default values unless they were already present
        if (pageSize !== DEFAULT_PAGE_SIZE || request.queryParams.pageSize !== undefined) {
            request.queryParams.pageSize = pageSize;
        }
        if (pageToken !== undefined || request.queryParams.pageToken !== undefined) {
            request.queryParams.pageToken = pageToken;
        }
    }

    return request;
}

// Only call this function if you are certain the list view hasn't changed (ie:
// the listInfoEtag in the body is the same as the cached listInfo.eTag)
function onResourceSuccess_getMruListRecords(
    luvio: Luvio,
    config: GetMruListUiConfig,
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
        config,
        listInfo,
        fields
    );

    luvio.storeBroadcast();

    return snapshot;
}

function onResourceError_getMruListRecords(
    luvio: Luvio,
    config: GetMruListUiConfig,
    listInfo: ListInfoRepresentation,
    err: FetchResponse<unknown>
) {
    const errorSnapshot = luvio.errorSnapshot(
        err,
        buildSnapshotRefresh_getMruListUi(luvio, config)
    );
    luvio.storeIngestError(
        listUiRepresentation_keyBuilder({
            ...listInfo.listReference,
            sortBy: config.sortBy === undefined ? null : config.sortBy,
        }),
        errorSnapshot
    );
    luvio.storeBroadcast();
    return errorSnapshot;
}

function buildNetworkSnapshot_getMruListRecords(
    luvio: Luvio,
    config: GetMruListUiConfig,
    listInfo: ListInfoRepresentation,
    snapshot?: Snapshot<ListUiRepresentation>
): Promise<Snapshot<ListUiRepresentation>> {
    const request = prepareRequest_getMruListRecords(luvio, config, listInfo, snapshot);

    return luvio.dispatchResourceRequest<ListRecordCollectionRepresentation>(request).then(
        (response) => {
            const { body } = response;

            // fall back to mru-list-ui if list view has changed
            if (body.listInfoETag !== listInfo.eTag) {
                return buildNetworkSnapshot_getMruListUi(luvio, config);
            }

            // response might have records.sortBy in csv format but keyBuilder/ingestion
            // functions expect it to be an array so coerce it here if needed
            const { sortBy } = body;
            if (sortBy && typeof sortBy === 'string') {
                body.sortBy = (sortBy as unknown as string).split(',');
            }

            // else ingest
            return luvio.handleSuccessResponse(
                () => onResourceSuccess_getMruListRecords(luvio, config, listInfo, response),
                () =>
                    types_ListRecordCollectionRepresentation_getTypeCacheKeys(body, () =>
                        ListRecordCollectionRepresentation_keyBuilderFromType(body)
                    )
            );
        },
        (err: FetchResponse<unknown>) => {
            return luvio.handleErrorResponse(() => {
                return onResourceError_getMruListRecords(luvio, config, listInfo, err);
            });
        }
    );
}

// functions to retrieve a ListInfoRepresentation

type BuildListInfoSnapshotContext = {
    config: GetMruListUiConfig;
    luvio: Luvio;
};

function buildCachedListInfoSnapshot(
    context: BuildListInfoSnapshotContext,
    storeLookup: StoreLookup<ListInfoRepresentation>
): Snapshot<ListInfoRepresentation> {
    const { config } = context;

    // try to get a list reference and a list info for the list; this should come back
    // non-null if we have the list info cached
    return getListInfo(
        {
            id: null,
            listViewApiName: null,
            objectApiName: config.objectApiName,
            type: 'mru',
        },
        storeLookup
    );
}

// functions to retrieve a ListUiRepresentation

type BuildListUiSnapshotContext = {
    config: GetMruListUiConfig;
    listInfo: ListInfoRepresentation | undefined;
    listUi?: Snapshot<ListUiRepresentation>;
    luvio: Luvio;
};

function buildCachedListUiSnapshot(
    context: BuildListUiSnapshotContext,
    storeLookup: StoreLookup<ListUiRepresentation>
): Snapshot<ListUiRepresentation> | undefined {
    const { config, listInfo, luvio } = context;

    if (listInfo !== undefined) {
        context.listUi = buildCachedSnapshot(luvio, storeLookup, config, listInfo);
        return context.listUi;
    }
}

function buildNetworkListUiSnapshot(
    context: BuildListUiSnapshotContext
): Promise<Snapshot<ListUiRepresentation>> {
    const { config, listInfo, listUi, luvio } = context;

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
        return buildNetworkSnapshot_getMruListUi(luvio, config);
    }

    // we *should* only be missing records and/or tokens at this point; send a list-records
    // request to fill them in
    return buildNetworkSnapshot_getMruListRecords(luvio, config, listInfo, listUi);
}

export const factory: AdapterFactory<GetMruListUiConfig, ListUiRepresentation> = (luvio: Luvio) =>
    function getMruListUi(untrustedConfig: unknown, requestContext?: AdapterRequestContext) {
        const config = validateAdapterConfig(
            untrustedConfig,
            getMruListUi_ConfigPropertyNames_augmented
        );

        if (config === null) {
            return null;
        }

        const definedRequestContext = requestContext || {};

        // try to find a cached ListInfoRepresentation
        const listInfoPromiseOrSnapshot = luvio.applyCachePolicy(
            definedRequestContext,
            { config, luvio },
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
                { config, listInfo, luvio },
                buildCachedListUiSnapshot,
                buildNetworkListUiSnapshot
            );
        };

        return isPromise(listInfoPromiseOrSnapshot)
            ? listInfoPromiseOrSnapshot.then(processListInfo)
            : processListInfo(listInfoPromiseOrSnapshot);
    };
