import {
    AdapterFactory,
    Fragment,
    LDS,
    Selector,
    Snapshot,
    FetchResponse,
    SnapshotRefresh,
} from '@ldsjs/engine';
import {
    GetMruListUiConfig,
    getMruListUi_ConfigPropertyNames,
    validateAdapterConfig,
} from '../../generated/adapters/getMruListUi';
import getUiApiMruListRecordsByObjectApiName from '../../generated/resources/getUiApiMruListRecordsByObjectApiName';
import getUiApiMruListUiByObjectApiName from '../../generated/resources/getUiApiMruListUiByObjectApiName';
import { ListInfoRepresentation } from '../../generated/types/ListInfoRepresentation';
import {
    keyBuilder as ListRecordCollectionRepresentation_keyBuilder,
    ListRecordCollectionRepresentation,
    paginationKeyBuilder as ListRecordCollection_paginationKeyBuilder,
} from '../../generated/types/ListRecordCollectionRepresentation';
import {
    keyBuilder as listUiRepresentation_keyBuilder,
    ListUiRepresentation,
} from '../../generated/types/ListUiRepresentation';
import { buildSelectionFromFields } from '../../selectors/record';
import { getListInfo, LIST_INFO_SELECTIONS, ListFields, listFields } from '../../util/lists';
import {
    minimizeRequest,
    pathSelectionsFor,
    staticValuePathSelection,
} from '../../util/pagination';
import { select as ListReferenceRepresentation_select } from '../../generated/types/ListReferenceRepresentation';

const LIST_REFERENCE_SELECTIONS = ListReferenceRepresentation_select();

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

function buildListUiFragment(
    config: GetMruListUiConfig,
    listInfo: ListInfoRepresentation,
    fields: ListFields
): Fragment {
    return {
        kind: 'Fragment',
        selections: [
            {
                kind: 'Link',
                name: 'info',
                fragment: {
                    kind: 'Fragment',
                    selections: LIST_INFO_SELECTIONS,
                },
            },
            {
                kind: 'Link',
                name: 'records',
                fragment: {
                    kind: 'Fragment',
                    selections: [
                        ...pathSelectionsFor({
                            name: 'records',
                            pageSize: config.pageSize || DEFAULT_PAGE_SIZE,
                            pageToken: config.pageToken,
                            selections: buildSelectionFromFields(
                                ...fields.getRecordSelectionFieldSets()
                            ),
                            tokenDataKey: ListRecordCollection_paginationKeyBuilder({
                                listViewId: listInfo.eTag,
                                sortBy: config.sortBy === undefined ? null : config.sortBy,
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
                                config.pageSize === undefined ? DEFAULT_PAGE_SIZE : config.pageSize,
                        }),
                        {
                            // TODO - check type; re-verify after sortBy added to key
                            kind: 'Scalar',
                            name: 'sortBy',
                        },
                    ],
                },
            },
        ],
    };
}

function buildSnapshotRefresh(
    lds: LDS,
    config: GetMruListUiConfig
): SnapshotRefresh<ListUiRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot_getMruListUi(lds, config),
    };
}

export function buildInMemorySnapshot(
    lds: LDS,
    config: GetMruListUiConfig,
    listInfo: ListInfoRepresentation,
    fields?: ListFields
): Snapshot<ListUiRepresentation> {
    const listFields_ = fields || listFields(lds, config, listInfo);

    const request = getUiApiMruListUiByObjectApiName({
        urlParams: {
            objectApiName: config.objectApiName,
        },
        queryParams: {
            fields: config.fields,
            optionalFields: config.optionalFields,
            pageSize: config.pageSize,
            pageToken: config.pageToken,
            sortBy: config.sortBy,
        },
    });

    const selector: Selector = {
        recordId: request.key,
        node: buildListUiFragment(config, listInfo, listFields_),
        variables: {},
    };

    return lds.storeLookup<ListUiRepresentation>(selector, buildSnapshotRefresh(lds, config));
}

/**
 * Builds, sends, and processes the result of a mru-list-ui request, ignoring any cached
 * data for the list.
 *
 * @param lds LDS engine
 * @param config wire config
 */
function buildNetworkSnapshot_getMruListUi(
    lds: LDS,
    config: GetMruListUiConfig
): Promise<Snapshot<ListUiRepresentation>> {
    const { fields, optionalFields, pageSize, pageToken, sortBy } = config;
    const queryParams = {
        fields,
        optionalFields,
        pageSize,
        pageToken,
        sortBy,
    };

    let request = getUiApiMruListUiByObjectApiName({
        urlParams: {
            objectApiName: config.objectApiName,
        },
        queryParams,
    });

    return lds.dispatchResourceRequest<ListUiRepresentation>(request).then(
        response => {
            const { body } = response;
            const listInfo = body.info;

            // TODO: server botches records.listReference but gets info.listReference correct,
            // see W-6933698
            body.records.listReference = body.info.listReference;

            // TODO: server should inject default pageSize when none was specified, see
            // W-6935308
            if (body.records.pageSize === null) {
                body.records.pageSize = DEFAULT_PAGE_SIZE;
            }

            // TODO: server should inject default sortBy when none was specified, see
            // W-6935308
            if (body.records.sortBy === null) {
                // default sortBy is a pain to calculate, wait for real fix
            }

            // server returns sortBy in csv format
            if (body.records.sortBy) {
                body.records.sortBy = ((body.records.sortBy as unknown) as string).split(',');
            }

            const listUiKey = listUiRepresentation_keyBuilder({
                ...listInfo.listReference,
                sortBy: body.records.sortBy,
            });

            // grab relevant bits before ingest destroys the structure
            const fields = listFields(lds, config, listInfo);
            fields.processRecords(body.records.records);

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
        (err: unknown) => {
            return lds.errorSnapshot(err, buildSnapshotRefresh(lds, config));
        }
    );
}

function buildNetworkSnapshot_getMruListRecords(
    lds: LDS,
    config: GetMruListUiConfig,
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

    const request = getUiApiMruListRecordsByObjectApiName({
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
            pagination: lds.pagination(
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

    return lds.dispatchResourceRequest<ListRecordCollectionRepresentation>(request).then(
        response => {
            const { body } = response;
            const { listInfoETag } = body;

            // fall back to mru-list-ui if list view has changed
            if (listInfoETag !== listInfo.eTag) {
                return buildNetworkSnapshot_getMruListUi(lds, config);
            }

            // TODO: server botches records.listReference but gets info.listReference correct,
            // see W-6933698
            body.listReference = listInfo.listReference;

            // TODO: server should inject default pageSize when none was specified, see
            // W-6935308
            if (body.pageSize === null) {
                body.pageSize = DEFAULT_PAGE_SIZE;
            }

            // TODO: server should inject default sortBy when none was specified, see
            // W-6935308
            if (body.sortBy === null) {
                // default sortBy is a pain to calculate, wait for real fix
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
                    sortBy: config.sortBy === undefined ? null : config.sortBy,
                }),
                err
            );
            lds.storeBroadcast();
            return lds.errorSnapshot(err, buildSnapshotRefresh(lds, config));
        }
    );
}

export const getMruListUiAdapterFactory: AdapterFactory<
    GetMruListUiConfig,
    ListUiRepresentation
> = (lds: LDS) =>
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
        const listInfo = getListInfo(
            {
                id: null,
                listViewApiName: null,
                objectApiName: config.objectApiName,
                type: 'mru',
            },
            lds
        );

        // no list info means it's not in the cache - make a full list-ui request
        if (!listInfo) {
            return buildNetworkSnapshot_getMruListUi(lds, config);
        }

        // with the list info we can construct the full selector and try to get the
        // list ui from the store
        const snapshot = buildInMemorySnapshot(lds, config, listInfo);

        // if the list ui was not found in the store then
        // make a full list-ui request
        if (!snapshot.data) {
            return buildNetworkSnapshot_getMruListUi(lds, config);
        }

        if (lds.snapshotDataAvailable(snapshot)) {
            // cache hit :partyparrot:
            return snapshot;
        }

        // we *should* only be missing records and/or tokens at this point; send a list-records
        // request to fill them in
        return buildNetworkSnapshot_getMruListRecords(lds, config, listInfo, snapshot);
    };
