import {
    AdapterFactory,
    Fragment,
    Luvio,
    Snapshot,
    Selector,
    FetchResponse,
    SnapshotRefresh,
    ResourceResponse,
} from '@luvio/engine';

import {
    GetListViewSummaryCollectionConfig,
    validateAdapterConfig,
    getListViewSummaryCollection_ConfigPropertyNames,
    createResourceParams,
} from '../../generated/adapters/getListViewSummaryCollection';
import {
    ListViewSummaryCollectionRepresentation,
    paginationKeyBuilder,
    ingest as listViewSummaryCollectionRepresentationIngest,
    select as listViewSummaryCollectionRepresentationSelect,
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

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO RAML - this more properly goes in the generated resource files
const DEFAULT_PAGE_SIZE = 20;

const LISTVIEWSUMMARY_PATH_SELECTIONS = listViewSummaryRepresentationSelect().selections;
const LIST_VIEW_SUMMARY_COLLECTION_PRIVATE =
    listViewSummaryCollectionRepresentationSelect().private;

function buildListViewSummaryCollectionFragment(
    config: GetListViewSummaryCollectionConfig
): Fragment {
    return {
        kind: 'Fragment',
        private: LIST_VIEW_SUMMARY_COLLECTION_PRIVATE,
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
    luvio: Luvio,
    config: GetListViewSummaryCollectionConfig,
    snapshot?: Snapshot<ListViewSummaryCollectionRepresentation>
): SnapshotRefresh<ListViewSummaryCollectionRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config, snapshot),
    };
}
export function buildInMemorySnapshot(
    luvio: Luvio,
    config: GetListViewSummaryCollectionConfig
): Snapshot<ListViewSummaryCollectionRepresentation> {
    const selector: Selector = {
        recordId: keyBuilder(createResourceParams(config)),
        node: buildListViewSummaryCollectionFragment(config),
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
    const snapshot = buildInMemorySnapshot(luvio, config);
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
    snapshot?: Snapshot<ListViewSummaryCollectionRepresentation>
) {
    const resourceParams = createResourceParams(config);
    const key = keyBuilder(resourceParams);
    const request = prepareRequest(luvio, config, resourceParams, snapshot);

    return luvio.dispatchResourceRequest<ListViewSummaryCollectionRepresentation>(request).then(
        (resp: FetchResponse<ListViewSummaryCollectionRepresentation>) => {
            return onResourceSuccess(luvio, config, key, resp);
        },
        (error: FetchResponse<unknown>) => {
            return onResourceError(luvio, config, key, error);
        }
    );
}

export const factory: AdapterFactory<
    GetListViewSummaryCollectionConfig,
    ListViewSummaryCollectionRepresentation
> = (luvio: Luvio) =>
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

        const cacheSnapshot = buildInMemorySnapshot(luvio, config);

        // Cache Hit
        if (luvio.snapshotAvailable(cacheSnapshot)) {
            return cacheSnapshot;
        }

        return luvio.resolveSnapshot(
            cacheSnapshot,
            buildRefreshSnapshot(luvio, config, cacheSnapshot)
        );
    };
