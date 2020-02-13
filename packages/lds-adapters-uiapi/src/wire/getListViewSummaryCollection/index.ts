import { AdapterFactory, Fragment, LDS, Snapshot, Selector, FetchResponse } from '@ldsjs/engine';

import {
    GetListViewSummaryCollectionConfig,
    validateAdapterConfig,
    getListViewSummaryCollection_ConfigPropertyNames,
} from '../../generated/adapters/getListViewSummaryCollection';

import { isFulfilledSnapshot } from '../../util/snapshot';
import {
    ListViewSummaryCollectionRepresentation,
    paginationKeyBuilder,
} from '../../generated/types/ListViewSummaryCollectionRepresentation';
import getUiApiListUiByObjectApiName from '../../generated/resources/getUiApiListUiByObjectApiName';
import {
    pathSelectionsFor,
    minimizeRequest,
    staticValuePathSelection,
} from '../../util/pagination';
import { refreshable } from '../../generated/adapters/adapter-utils';
import { select as listViewSummaryRepresentationSelect } from '../../generated/types/ListViewSummaryRepresentation';

// TODO RAML - this more properly goes in the generated resource files
const DEFAULT_PAGE_SIZE = 20;

const LISTVIEWSUMMARY_PATH_SELECTIONS = listViewSummaryRepresentationSelect().selections;

function buildListViewSummaryCollectionFragment(
    config: GetListViewSummaryCollectionConfig
): Fragment {
    return {
        kind: 'Fragment',
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

export function buildInMemorySnapshot(
    lds: LDS,
    config: GetListViewSummaryCollectionConfig
): Snapshot<ListViewSummaryCollectionRepresentation> {
    const request = getUiApiListUiByObjectApiName({
        urlParams: { objectApiName: config.objectApiName },
        queryParams: {
            pageSize: config.pageSize,
            pageToken: config.pageToken,
            q: config.q,
            recentListsOnly: config.recentListsOnly,
        },
    });

    const selector: Selector = {
        recordId: request.key,
        node: buildListViewSummaryCollectionFragment(config),
        variables: {},
    };

    return lds.storeLookup<ListViewSummaryCollectionRepresentation>(selector);
}

export function buildNetworkSnapshot(
    lds: LDS,
    config: GetListViewSummaryCollectionConfig,
    snapshot?: Snapshot<ListViewSummaryCollectionRepresentation>
) {
    const request = getUiApiListUiByObjectApiName({
        urlParams: { objectApiName: config.objectApiName },
        queryParams: {
            pageSize: config.pageSize,
            pageToken: config.pageToken,
            q: config.q,
            recentListsOnly: config.recentListsOnly,
        },
    });

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

    return lds.dispatchResourceRequest<ListViewSummaryCollectionRepresentation>(request).then(
        (resp: FetchResponse<ListViewSummaryCollectionRepresentation>) => {
            const { body } = resp;
            lds.storeIngest<ListViewSummaryCollectionRepresentation>(request.key, request, body);
            lds.storeBroadcast();
            return buildInMemorySnapshot(lds, config);
        },
        (error: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(request.key, error);
            lds.storeBroadcast();
            return lds.errorSnapshot(error);
        }
    );
}

export const getListViewSummaryCollectionAdapterFactory: AdapterFactory<
    GetListViewSummaryCollectionConfig,
    ListViewSummaryCollectionRepresentation
> = (lds: LDS) => {
    return refreshable(
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
            if (isFulfilledSnapshot(cacheSnapshot)) {
                return cacheSnapshot;
            }

            return buildNetworkSnapshot(lds, config, cacheSnapshot);
        },
        // Refresh snapshot
        (untrustedConfig: unknown) => {
            const config = validateAdapterConfig(
                untrustedConfig,
                getListViewSummaryCollection_ConfigPropertyNames
            );

            // This should never happen
            if (config === null) {
                throw new Error(
                    'Invalid config passed to "getListViewSummaryCollection" refresh function'
                );
            }

            return buildNetworkSnapshot(lds, config);
        }
    );
};
