import {
    Adapter,
    AdapterFactory,
    FetchResponse,
    Fragment,
    LDS,
    ResourceRequest,
    Snapshot,
    SnapshotRefresh,
} from '@ldsjs/engine';
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
} from '../../generated/types/ListRecordCollectionRepresentation';
import { select as ListReferenceRepresentation_select } from '../../generated/types/ListReferenceRepresentation';
import {
    keyBuilder as listUiRepresentation_keyBuilder,
    ListUiRepresentation,
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
} from '../../util/lists';
import {
    minimizeRequest,
    pathSelectionsFor,
    staticValuePathSelection,
} from '../../util/pagination';
import { getListViewSummaryCollectionAdapterFactory } from '../getListViewSummaryCollection';
import { getMruListUiAdapterFactory } from '../getMruListUi';

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

function getSortBy(config: GetListUiConfig): string[] | null {
    if (config.sortBy !== undefined) {
        return config.sortBy;
    }

    const defaults = getServerDefaults(config);

    if (defaults.sortBy !== undefined) {
        return defaults.sortBy;
    }

    return null;
}

function buildListUiFragment(
    config: GetListUiConfig,
    listInfo: ListInfoRepresentation,
    fields: ListFields
): Fragment {
    const defaultedConfig = { ...getServerDefaults(config), ...config };

    return {
        kind: 'Fragment',
        private: [],
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
    lds: LDS,
    config: GetListUiConfig,
    listInfo: ListInfoRepresentation,
    fields?: ListFields
): Snapshot<ListUiRepresentation> {
    const listUiKey = listUiRepresentation_keyBuilder({
        ...listInfo.listReference,
        sortBy: getSortBy(config),
    });
    const listFields_ = fields || listFields(lds, config, listInfo);

    const selector = {
        recordId: listUiKey,
        node: buildListUiFragment(config, listInfo, listFields_),
        variables: {},
    };

    return lds.storeLookup<ListUiRepresentation>(selector, buildSnapshotRefresh(lds, config));
}

function buildSnapshotRefresh(
    lds: LDS,
    config: GetListUiConfig
): SnapshotRefresh<ListUiRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot_getListUi(lds, config),
    };
}

/**
 * Builds, sends, and processes the result of a list-ui request, ignoring any cached
 * data for the list view.
 *
 * @param lds LDS engine
 * @param config wire config
 */
function buildNetworkSnapshot_getListUi(
    lds: LDS,
    config: GetListUiConfig
): Promise<Snapshot<ListUiRepresentation>> {
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

    return lds.dispatchResourceRequest<ListUiRepresentation>(request).then(
        response => {
            const { body } = response,
                listInfo = body.info,
                { listReference } = listInfo;

            // server returns sortBy in csv format
            if (body.records.sortBy) {
                body.records.sortBy = ((body.records.sortBy as unknown) as string).split(',');
            }

            const listUiKey = listUiRepresentation_keyBuilder({
                ...listReference,
                sortBy: body.records.sortBy,
            });

            // grab relevant bits before ingest destroys the structure
            const fields = listFields(lds, config, listInfo);
            fields.processRecords(body.records.records);

            // remember the id/name of this list
            addListReference(listReference);

            // remember any default values that the server filled in
            addServerDefaults(config, body);

            // build the selector while the list info is still easily accessible
            const fragment = buildListUiFragment(config, listInfo, fields);

            lds.storeIngest(listUiKey, request, body);
            lds.storeBroadcast();

            return lds.storeLookup<ListUiRepresentation>(
                {
                    recordId: listUiKey,
                    node: fragment,
                    variables: {},
                },
                buildSnapshotRefresh(lds, config)
            );
        },
        (err: FetchResponse<unknown>) => {
            return lds.errorSnapshot(err, buildSnapshotRefresh(lds, config));
        }
    );
}

function buildNetworkSnapshot_getListRecords(
    lds: LDS,
    config: GetListUiConfig,
    listInfo: ListInfoRepresentation,
    snapshot?: Snapshot<ListUiRepresentation>
): Promise<Snapshot<ListUiRepresentation>> {
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
            pagination: lds.pagination(
                ListRecordCollection_paginationKeyBuilder({
                    listViewId: listInfo.eTag,
                    sortBy: getSortBy(config),
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

    return lds.dispatchResourceRequest<ListRecordCollectionRepresentation>(request).then(
        response => {
            const { body } = response;
            const { listInfoETag } = body;

            // fall back to list-ui if list view has changed
            if (listInfoETag !== listInfo.eTag) {
                return buildNetworkSnapshot_getListUi(lds, config);
            }

            // server returns sortBy in csv format
            if (body.sortBy) {
                body.sortBy = ((body.sortBy as unknown) as string).split(',');
            }

            const fields = listFields(lds, config, listInfo).processRecords(body.records);

            lds.storeIngest(
                ListRecordCollectionRepresentation_keyBuilder({
                    listViewId: listInfoETag,
                    sortBy: body.sortBy,
                }),
                request,
                body
            );
            lds.storeBroadcast();

            return buildInMemorySnapshot(lds, config, listInfo, fields);
        },
        (err: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(
                listUiRepresentation_keyBuilder({
                    ...listInfo.listReference,
                    sortBy: getSortBy(config),
                }),
                err
            );
            lds.storeBroadcast();
            return lds.errorSnapshot(err);
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

export const factory: AdapterFactory<
    | GetListViewSummaryCollectionConfig
    | GetListUiByApiNameConfig
    | GetListUiByListViewIdConfig
    | GetMruListUiConfig,
    ListUiRepresentation | ListViewSummaryCollectionRepresentation
> = (lds: LDS) => {
    // adapter implementation for getListUiBy*
    const listUiAdapter = (untrustedConfig: unknown) => {
        const config = validateGetListUiConfig(untrustedConfig);

        if (config === null) {
            return null;
        }

        // try to get a list reference and a list info for the list; this should come back
        // non-null if we have the list info cached
        const listRef = getListReference(config);
        const listInfo = listRef && getListInfo(listRef, lds);

        // no list info means it's not in the cache - make a full list-ui request
        if (!listInfo) {
            return buildNetworkSnapshot_getListUi(lds, config);
        }

        // with the list info we can construct the full selector and try to get the
        // list ui from the store
        const snapshot = buildInMemorySnapshot(lds, config, listInfo);

        // if the list ui was not found in the store then
        // make a full list-ui request
        if (!snapshot.data) {
            return buildNetworkSnapshot_getListUi(lds, config);
        }

        if (lds.snapshotDataAvailable(snapshot)) {
            // cache hit :partyparrot:
            return snapshot;
        }

        // we *should* only be missing records and/or tokens at this point; send a list-records
        // request to fill them in
        return buildNetworkSnapshot_getListRecords(lds, config, listInfo, snapshot);
    };

    let listViewSummaryCollectionAdapter: Adapter<any, any> | null = null;
    let mruAdapter: Adapter<any, any> | null = null;

    // delegate to various other adapter based on what config looks like; note that the adapters
    // we delegate to are responsible for returning refreshable results
    return function(untrustedConfig: unknown) {
        // if the MRU symbol is there then just return the getMruListUi adapter
        if (looksLikeGetMruListUiConfig(untrustedConfig)) {
            if (mruAdapter === null) {
                mruAdapter = getMruListUiAdapterFactory(lds);
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
                listViewSummaryCollectionAdapter = getListViewSummaryCollectionAdapterFactory(lds);
            }

            return listViewSummaryCollectionAdapter(untrustedConfig);
        }

        // see if config looks like a listViewId or listViewApiName request
        if (
            looksLikeGetListUiByApiNameConfig(untrustedConfig) ||
            looksLikeGetListUiByListViewIdConfig(untrustedConfig)
        ) {
            return listUiAdapter(untrustedConfig);
        }

        return null;
    };
};
