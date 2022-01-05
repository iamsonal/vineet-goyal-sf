import {
    AdapterFactory,
    Fragment,
    Luvio,
    Selector,
    Snapshot,
    FetchResponse,
    SnapshotRefresh,
    ResourceResponse,
    UnAvailableSnapshot,
} from '@luvio/engine';
import {
    GetMruListUiConfig,
    getMruListUi_ConfigPropertyNames,
    validateAdapterConfig,
    createResourceParams,
} from '../../generated/adapters/getMruListUi';
import { createResourceRequest as createMruListRecordsResourceRequest } from '../../generated/resources/getUiApiMruListRecordsByObjectApiName';
import {
    createResourceRequest as createMruListUiResourceRequest,
    createPaginationParams as getUiApiMruListUiByObjectApiName_createPaginationParams,
    keyBuilder,
} from '../../generated/resources/getUiApiMruListUiByObjectApiName';
import { ListInfoRepresentation } from '../../generated/types/ListInfoRepresentation';
import { createResourceParams as createMruListUiResourceParams } from '../../generated/adapters/getMruListUi';
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
import { buildSelectionFromFields } from '../../selectors/record';
import { getListInfo, ListFields, listFields, isListInfoSnapshotWithData } from '../../util/lists';
import { minimizeRequest } from '../../util/pagination';
import { isFulfilledSnapshot } from '../../util/snapshot';

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

function buildSnapshotRefresh_getMruListRecords(
    luvio: Luvio,
    config: GetMruListUiConfig,
    listInfo: ListInfoRepresentation,
    snapshot?: Snapshot<ListUiRepresentation>
): SnapshotRefresh<ListUiRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot_getMruListRecords(luvio, config, listInfo, snapshot),
    };
}

function onResourceSuccess_getMruListUi(
    luvio: Luvio,
    config: GetMruListUiConfig,
    response: ResourceResponse<ListUiRepresentation>
) {
    const { body } = response;
    const listInfo = body.info;

    // response might have records.sortBy in csv format
    const sortBy = body.records.sortBy;
    if (sortBy && typeof sortBy === 'string') {
        body.records.sortBy = (sortBy as unknown as string).split(',');
    }

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

export function buildInMemorySnapshot(
    luvio: Luvio,
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

    return luvio.storeLookup<ListUiRepresentation>(
        selector,
        buildSnapshotRefresh_getMruListUi(luvio, config)
    );
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
            return onResourceSuccess_getMruListUi(luvio, config, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResourceError_getMruListUi(luvio, config, err);
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

function onResourceSuccess_getMruListRecords(
    luvio: Luvio,
    config: GetMruListUiConfig,
    listInfo: ListInfoRepresentation,
    response: ResourceResponse<ListRecordCollectionRepresentation>
) {
    const { body } = response;
    const { listInfoETag } = body;

    // fall back to mru-list-ui if list view has changed
    if (listInfoETag !== listInfo.eTag) {
        return buildNetworkSnapshot_getMruListUi(luvio, config);
    }

    // server returns sortBy in csv format
    if (body.sortBy) {
        body.sortBy = (body.sortBy as unknown as string).split(',');
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

    const snapshot = buildInMemorySnapshot(luvio, config, listInfo, fields);

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
            return onResourceSuccess_getMruListRecords(luvio, config, listInfo, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResourceError_getMruListRecords(luvio, config, listInfo, err);
        }
    );
}

function getMruListUiSnapshotFromListInfo(
    luvio: Luvio,
    config: GetMruListUiConfig,
    listInfo: ListInfoRepresentation
) {
    // with the list info we can construct the full selector and try to get the
    // list ui from the store
    const snapshot = buildInMemorySnapshot(luvio, config, listInfo);

    if (luvio.snapshotAvailable(snapshot)) {
        // cache hit :partyparrot:
        return snapshot;
    }

    // if the list ui was not found in the store then
    // make a full list-ui request
    if (!snapshot.data) {
        return luvio.resolveSnapshot(snapshot, buildSnapshotRefresh_getMruListUi(luvio, config));
    }

    // we *should* only be missing records and/or tokens at this point; send a list-records
    // request to fill them in
    return luvio.resolveSnapshot(
        snapshot,
        buildSnapshotRefresh_getMruListRecords(luvio, config, listInfo, snapshot)
    );
}

export const factory: AdapterFactory<GetMruListUiConfig, ListUiRepresentation> = (luvio: Luvio) =>
    function getMruListUi(untrustedConfig: unknown) {
        const config = validateAdapterConfig(
            untrustedConfig,
            getMruListUi_ConfigPropertyNames_augmented
        );

        if (config === null) {
            return null;
        }

        // try to get a list reference and a list info for the list; this should come back
        // non-null if we have the list info cached
        const listInfoSnapshot = getListInfo(
            {
                id: null,
                listViewApiName: null,
                objectApiName: config.objectApiName,
                type: 'mru',
            },
            luvio
        );

        // if we have list info then build a snapshot from that
        if (isFulfilledSnapshot(listInfoSnapshot)) {
            return getMruListUiSnapshotFromListInfo(luvio, config, listInfoSnapshot.data);
        }

        // In default environment resolving a snapshot is just hitting the network
        // using the given SnapshotRefresh (so mru-list-ui in this case).  In durable environment
        // resolving a snapshot will first attempt to read the missing cache keys
        // from the given UnAvailable snapshot (a list-info snapshot in this case) and build a
        // fulfilled snapshot from that if those cache keys are present, otherwise it refreshes
        // with the given SnapshotRefresh.  Usually the SnapshotRefresh response and the UnAvailable
        // snapshot are for the same response Type, but this lists adapter is special (it mixes
        // calls with list-info, list-records, and mru-list-ui), and so our use of resolveSnapshot
        // is special (polymorphic response, could either be a list-info representation or a
        // list-ui representation).
        return luvio
            .resolveSnapshot(
                listInfoSnapshot as UnAvailableSnapshot<ListInfoRepresentation>,
                buildSnapshotRefresh_getMruListUi(
                    luvio,
                    config
                ) as unknown as SnapshotRefresh<ListInfoRepresentation>
            )
            .then((resolvedSnapshot) => {
                // if result came from cache we know it's a listinfo, otherwise
                // it's a full list-ui response
                if (isListInfoSnapshotWithData(resolvedSnapshot)) {
                    return getMruListUiSnapshotFromListInfo(luvio, config, resolvedSnapshot.data);
                }

                return resolvedSnapshot as Snapshot<ListUiRepresentation>;
            });
    };
