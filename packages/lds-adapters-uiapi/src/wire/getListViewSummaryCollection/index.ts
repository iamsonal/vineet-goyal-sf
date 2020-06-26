import {
    AdapterFactory,
    Fragment,
    LDS,
    Snapshot,
    Selector,
    FetchResponse,
    SnapshotRefresh,
    ResourceRequest,
    ResourceResponse,
    UnfulfilledSnapshot,
} from '@ldsjs/engine';

import {
    GetListViewSummaryCollectionConfig,
    validateAdapterConfig,
    getListViewSummaryCollection_ConfigPropertyNames,
    createResourceParams,
} from '../../generated/adapters/getListViewSummaryCollection';
import {
    ListViewSummaryCollectionRepresentation,
    paginationKeyBuilder,
} from '../../generated/types/ListViewSummaryCollectionRepresentation';
import {
    createResourceRequest,
    keyBuilder,
} from '../../generated/resources/getUiApiListUiByObjectApiName';
import {
    pathSelectionsFor,
    minimizeRequest,
    staticValuePathSelection,
} from '../../util/pagination';
import { select as listViewSummaryRepresentationSelect } from '../../generated/types/ListViewSummaryRepresentation';
import { ResourceRequestConfig } from '../../generated/resources/getUiApiListUiByObjectApiName';
import { isUnfulfilledSnapshot } from '../../util/snapshot';

// TODO RAML - this more properly goes in the generated resource files
const DEFAULT_PAGE_SIZE = 20;

const LISTVIEWSUMMARY_PATH_SELECTIONS = listViewSummaryRepresentationSelect().selections;

function buildListViewSummaryCollectionFragment(
    config: GetListViewSummaryCollectionConfig
): Fragment {
    return {
        kind: 'Fragment',
        private: ['eTag'],
        selections: [
            ...pathSelectionsFor({
                name: 'lists',
                selections: LISTVIEWSUMMARY_PATH_SELECTIONS,
                pageSize: config.pageSize || DEFAULT_PAGE_SIZE,
                pageToken: config.pageToken,
                tokenDataKey: paginationKeyBuilder({
                    objectApiName: config.objectApiName,
                    queryString: config.q === undefined ? null : config.q,
                    recentListsOnly:
                        config.recentListsOnly === undefined ? false : config.recentListsOnly,
                }),
            }),
            {
                kind: 'Scalar',
                name: 'objectApiName',
            },
            staticValuePathSelection({
                name: 'pageSize',
                value: config.pageSize === undefined ? DEFAULT_PAGE_SIZE : config.pageSize,
            }),
            {
                kind: 'Scalar',
                name: 'queryString',
            },
            {
                kind: 'Scalar',
                name: 'recentListsOnly',
            },
        ],
    };
}

function buildRefreshSnapshot(
    lds: LDS,
    config: GetListViewSummaryCollectionConfig
): SnapshotRefresh<ListViewSummaryCollectionRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(lds, config),
    };
}
export function buildInMemorySnapshot(
    lds: LDS,
    config: GetListViewSummaryCollectionConfig
): Snapshot<ListViewSummaryCollectionRepresentation> {
    const selector: Selector = {
        recordId: keyBuilder(createResourceParams(config)),
        node: buildListViewSummaryCollectionFragment(config),
        variables: {},
    };

    return lds.storeLookup<ListViewSummaryCollectionRepresentation>(
        selector,
        buildRefreshSnapshot(lds, config)
    );
}

function prepareRequest(
    lds: LDS,
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
            pagination: lds.pagination(
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
    lds: LDS,
    config: GetListViewSummaryCollectionConfig,
    request: ResourceRequest,
    key: string,
    response: ResourceResponse<ListViewSummaryCollectionRepresentation>
) {
    const { body } = response;
    lds.storeIngest<ListViewSummaryCollectionRepresentation>(key, request, body);
    lds.storeBroadcast();
    return buildInMemorySnapshot(lds, config);
}

function onResourceError(
    lds: LDS,
    config: GetListViewSummaryCollectionConfig,
    key: string,
    error: FetchResponse<unknown>
) {
    lds.storeIngestFetchResponse(key, error);
    lds.storeBroadcast();
    return lds.errorSnapshot(error, buildRefreshSnapshot(lds, config));
}

function resolveUnfulfilledSnapshot(
    lds: LDS,
    config: GetListViewSummaryCollectionConfig,
    snapshot: UnfulfilledSnapshot<ListViewSummaryCollectionRepresentation, any>
) {
    const resourceParams = createResourceParams(config);
    const key = keyBuilder(resourceParams);
    const request = prepareRequest(lds, config, resourceParams, snapshot);

    return lds
        .resolveUnfulfilledSnapshot<ListViewSummaryCollectionRepresentation>(request, snapshot)
        .then(
            (resp: ResourceResponse<ListViewSummaryCollectionRepresentation>) => {
                return onResourceSuccess(lds, config, request, key, resp);
            },
            (error: FetchResponse<unknown>) => {
                return onResourceError(lds, config, key, error);
            }
        );
}

export function buildNetworkSnapshot(
    lds: LDS,
    config: GetListViewSummaryCollectionConfig,
    snapshot?: Snapshot<ListViewSummaryCollectionRepresentation>
) {
    const resourceParams = createResourceParams(config);
    const key = keyBuilder(resourceParams);
    const request = prepareRequest(lds, config, resourceParams, snapshot);

    return lds.dispatchResourceRequest<ListViewSummaryCollectionRepresentation>(request).then(
        (resp: FetchResponse<ListViewSummaryCollectionRepresentation>) => {
            return onResourceSuccess(lds, config, request, key, resp);
        },
        (error: FetchResponse<unknown>) => {
            return onResourceError(lds, config, key, error);
        }
    );
}

export const factory: AdapterFactory<
    GetListViewSummaryCollectionConfig,
    ListViewSummaryCollectionRepresentation
> = (lds: LDS) =>
    function getListViewSummaryCollection(
        untrustedConfig: unknown
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

        const cacheSnapshot = buildInMemorySnapshot(lds, config);

        // Cache Hit
        if (lds.snapshotDataAvailable(cacheSnapshot)) {
            return cacheSnapshot;
        }

        if (isUnfulfilledSnapshot(cacheSnapshot)) {
            return resolveUnfulfilledSnapshot(lds, config, cacheSnapshot);
        }

        return buildNetworkSnapshot(lds, config, cacheSnapshot);
    };
