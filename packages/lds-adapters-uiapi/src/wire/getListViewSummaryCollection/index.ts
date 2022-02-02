import {
    AdapterFactory,
    Luvio,
    Snapshot,
    Selector,
    FetchResponse,
    SnapshotRefresh,
    ResourceResponse,
    AdapterRequestContext,
    StoreLookup,
    ResourceRequestOverride,
    CoercedAdapterRequestContext,
} from '@luvio/engine';

import {
    GetListViewSummaryCollectionConfig,
    validateAdapterConfig,
    getListViewSummaryCollection_ConfigPropertyNames,
    createResourceParams,
    adapterFragment,
} from '../../generated/adapters/getListViewSummaryCollection';
import {
    ListViewSummaryCollectionRepresentation,
    paginationKeyBuilder,
    ingest as listViewSummaryCollectionRepresentationIngest,
} from '../../generated/types/ListViewSummaryCollectionRepresentation';
import {
    ResourceRequestConfig,
    createResourceRequest,
    keyBuilder,
    getResponseCacheKeys,
} from '../../generated/resources/getUiApiListUiByObjectApiName';
import { minimizeRequest } from '../../util/pagination';

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO RAML - this more properly goes in the generated resource files
const DEFAULT_PAGE_SIZE = 20;

function buildRefreshSnapshot(
    luvio: Luvio,
    config: GetListViewSummaryCollectionConfig,
    snapshot?: Snapshot<ListViewSummaryCollectionRepresentation>
): SnapshotRefresh<ListViewSummaryCollectionRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config, snapshot),
    };
}
export function buildCachedSnapshot(
    luvio: Luvio,
    config: GetListViewSummaryCollectionConfig
): Snapshot<ListViewSummaryCollectionRepresentation> {
    const selector: Selector = {
        recordId: keyBuilder(createResourceParams(config)),
        node: adapterFragment(luvio, config),
        variables: {},
    };

    return luvio.storeLookup<ListViewSummaryCollectionRepresentation>(
        selector,
        buildRefreshSnapshot(luvio, config)
    );
}

function prepareRequest(
    luvio: Luvio,
    config: GetListViewSummaryCollectionConfig,
    resourceParams: ResourceRequestConfig,
    snapshot?: Snapshot<ListViewSummaryCollectionRepresentation>
) {
    const request = createResourceRequest(resourceParams);

    if (snapshot) {
        // compute the minimum number of records we need to request
        const { pageSize, pageToken } = minimizeRequest({
            data: snapshot.data,
            name: 'lists',
            pageSize: config.pageSize || DEFAULT_PAGE_SIZE,
            pageToken: config.pageToken,
            pagination: luvio.pagination(
                paginationKeyBuilder({
                    objectApiName: config.objectApiName,
                    queryString: config.q === undefined ? null : config.q,
                    recentListsOnly:
                        config.recentListsOnly === undefined ? false : config.recentListsOnly,
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

function onResourceSuccess(
    luvio: Luvio,
    config: GetListViewSummaryCollectionConfig,
    key: string,
    response: ResourceResponse<ListViewSummaryCollectionRepresentation>
) {
    const { body } = response;
    luvio.storeIngest<ListViewSummaryCollectionRepresentation>(
        key,
        listViewSummaryCollectionRepresentationIngest,
        body
    );
    const snapshot = buildCachedSnapshot(luvio, config);
    luvio.storeBroadcast();
    return snapshot;
}

function onResourceError(
    luvio: Luvio,
    config: GetListViewSummaryCollectionConfig,
    key: string,
    error: FetchResponse<unknown>
) {
    const errorSnapshot = luvio.errorSnapshot(error, buildRefreshSnapshot(luvio, config));
    luvio.storeIngestError(key, errorSnapshot);
    luvio.storeBroadcast();
    return errorSnapshot;
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetListViewSummaryCollectionConfig,
    snapshot: Snapshot<ListViewSummaryCollectionRepresentation> | undefined,
    override?: ResourceRequestOverride
) {
    const resourceParams = createResourceParams(config);
    const key = keyBuilder(resourceParams);
    const request = prepareRequest(luvio, config, resourceParams, snapshot);

    return luvio
        .dispatchResourceRequest<ListViewSummaryCollectionRepresentation>(request, override)
        .then(
            (resp: FetchResponse<ListViewSummaryCollectionRepresentation>) => {
                return luvio.handleSuccessResponse(
                    () => {
                        return onResourceSuccess(luvio, config, key, resp);
                    },
                    () => {
                        return getResponseCacheKeys(resourceParams, resp.body);
                    }
                );
            },
            (error: FetchResponse<unknown>) => {
                return luvio.handleErrorResponse(() => {
                    return onResourceError(luvio, config, key, error);
                });
            }
        );
}

type BuildSnapshotContext = {
    config: GetListViewSummaryCollectionConfig;
    luvio: Luvio;
    snapshot?: Snapshot<ListViewSummaryCollectionRepresentation>;
};

function buildNetworkSnapshotCachePolicy(
    context: BuildSnapshotContext,
    requestContext: CoercedAdapterRequestContext
): Promise<Snapshot<ListViewSummaryCollectionRepresentation, any>> {
    const { config, luvio, snapshot } = context;
    let override = undefined;
    const { networkPriority } = requestContext;
    if (networkPriority !== 'normal') {
        override = {
            priority: networkPriority,
        };
    }
    return buildNetworkSnapshot(luvio, config, snapshot, override);
}

function buildCachedSnapshotCachePolicy(
    context: BuildSnapshotContext,
    storeLookup: StoreLookup<ListViewSummaryCollectionRepresentation>
): Snapshot<ListViewSummaryCollectionRepresentation, any> {
    const { config, luvio } = context;
    const selector: Selector = {
        recordId: keyBuilder(createResourceParams(config)),
        node: adapterFragment(luvio, config),
        variables: {},
    };

    const snapshot = storeLookup(selector, buildRefreshSnapshot(luvio, config));

    // if unfulfilled we save the snapshot so buildNetworkSnapshot can use it
    if (snapshot.state === 'Unfulfilled') {
        context.snapshot = snapshot;
    }

    return snapshot;
}

export const factory: AdapterFactory<
    GetListViewSummaryCollectionConfig,
    ListViewSummaryCollectionRepresentation
> = (luvio: Luvio) =>
    function getListViewSummaryCollection(
        untrustedConfig: unknown,
        requestContext?: AdapterRequestContext
    ):
        | Promise<Snapshot<ListViewSummaryCollectionRepresentation>>
        | Snapshot<ListViewSummaryCollectionRepresentation>
        | null {
        const config = validateAdapterConfig(
            untrustedConfig,
            getListViewSummaryCollection_ConfigPropertyNames
        );

        // Invalid or incomplete config
        if (config === null) {
            return null;
        }

        return luvio.applyCachePolicy(
            requestContext || {},
            {
                luvio,
                config,
            },
            buildCachedSnapshotCachePolicy,
            buildNetworkSnapshotCachePolicy
        );
    };
