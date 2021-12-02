import {
    Luvio,
    Selector,
    Snapshot,
    FetchResponse,
    SnapshotRefresh,
    ResourceResponse,
    AdapterRequestContext,
    StoreLookup,
} from '@luvio/engine';
import { GetRecordConfig, createResourceParams } from '../../generated/adapters/getRecord';
import {
    keyBuilder,
    getResponseCacheKeys,
} from '../../generated/resources/getUiApiRecordsByRecordId';
import { createResourceRequest } from '../../raml-artifacts/resources/getUiApiRecordsByRecordId/createResourceRequest';
import {
    keyBuilder as recordRepresentationKeyBuilder,
    RecordRepresentation,
} from '../../generated/types/RecordRepresentation';
import { getTrackedFields, convertFieldsToTrie } from '../../util/records';
import { buildSelectionFromFields } from '../../selectors/record';
import { difference } from '../../validation/utils';
import { createFieldsIngestSuccess as getRecordsResourceIngest } from '../../generated/fields/resources/getUiApiRecordsByRecordId';
import { configuration } from '../../configuration';
import { RECORD_REPRESENTATION_ERROR_STORE_METADATA_PARAMS } from './index';

// used by getUiApiRecordsBatchByRecordIds#selectChildResourceParams
export function buildRecordSelector(
    recordId: string,
    fields: string[],
    optionalFields: string[]
): Selector {
    return {
        recordId: recordRepresentationKeyBuilder({ recordId }),
        node: {
            kind: 'Fragment',
            private: ['eTag', 'weakEtag'],
            selections: buildSelectionFromFields(fields, optionalFields),
        },
        variables: {},
    };
}

function buildSnapshotRefresh(
    luvio: Luvio,
    config: GetRecordConfig
): SnapshotRefresh<RecordRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config),
    };
}

function prepareRequest(luvio: Luvio, config: GetRecordConfig) {
    const { recordId, fields } = config;

    // Should this go into the coersion logic?
    const key = keyBuilder(createResourceParams(config));

    const allTrackedFields = getTrackedFields(
        key,
        luvio.getNode(key),
        {
            maxDepth: configuration.getTrackedFieldDepthOnCacheMiss(),
            onlyFetchLeafNodeId: configuration.getTrackedFieldLeafNodeIdOnly(),
        },
        config.optionalFields
    );
    const optionalFields =
        fields === undefined ? allTrackedFields : difference(allTrackedFields, fields);
    const resourceParams = createResourceParams({
        recordId,
        fields,
        optionalFields: optionalFields.length > 0 ? optionalFields : undefined,
    });
    const request = createResourceRequest(resourceParams);

    return { request, key, allTrackedFields, resourceParams };
}

export function ingestSuccess(
    luvio: Luvio,
    config: GetRecordConfig,
    key: string,
    allTrackedFields: string[],
    response: ResourceResponse<RecordRepresentation>,
    serverRequestCount: number
) {
    const { body } = response;
    const fields = config.fields === undefined ? [] : config.fields;
    const optionalFields = config.optionalFields === undefined ? [] : config.optionalFields;

    const fieldTrie = convertFieldsToTrie(fields, false);
    luvio.storeIngest<RecordRepresentation>(
        key,
        getRecordsResourceIngest({
            fields: fieldTrie,
            optionalFields: convertFieldsToTrie(optionalFields, true),
            trackedFields: convertFieldsToTrie(allTrackedFields, true),
            serverRequestCount,
        }),
        body
    );

    return luvio.storeLookup<RecordRepresentation>(
        buildRecordSelector(config.recordId, fields, optionalFields),
        buildSnapshotRefresh(luvio, config)
    );
}

function onResourceSuccess(
    luvio: Luvio,
    config: GetRecordConfig,
    key: string,
    allTrackedFields: string[],
    response: ResourceResponse<RecordRepresentation>,
    serverRequestCount: number
) {
    const snapshot = ingestSuccess(
        luvio,
        config,
        key,
        allTrackedFields,
        response,
        serverRequestCount
    );
    luvio.storeBroadcast();
    return snapshot;
}

export function ingestError(
    luvio: Luvio,
    config: GetRecordConfig,
    key: string,
    err: FetchResponse<unknown>
) {
    const errorSnapshot = luvio.errorSnapshot(err, buildSnapshotRefresh(luvio, config));
    luvio.storeIngestError(key, errorSnapshot, RECORD_REPRESENTATION_ERROR_STORE_METADATA_PARAMS);
    return errorSnapshot;
}

function onResourceError(
    luvio: Luvio,
    config: GetRecordConfig,
    key: string,
    err: FetchResponse<unknown>
) {
    const errorSnapshot = ingestError(luvio, config, key, err);
    luvio.storeBroadcast();
    return errorSnapshot;
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetRecordConfig,
    serverRequestCount: number = 0
) {
    const { request, key, allTrackedFields, resourceParams } = prepareRequest(luvio, config);

    return luvio.dispatchResourceRequest<RecordRepresentation>(request).then(
        (response) => {
            return luvio.handleSuccessResponse(
                () =>
                    onResourceSuccess(
                        luvio,
                        config,
                        key,
                        allTrackedFields,
                        response,
                        serverRequestCount + 1
                    ),
                () => getResponseCacheKeys(resourceParams, response.body)
            );
        },
        (err: FetchResponse<unknown>) => {
            return onResourceError(luvio, config, key, err);
        }
    );
}

// used by getRecordLayoutType#refresh
export function buildInMemorySnapshot(
    luvio: Luvio,
    config: GetRecordConfig,
    refresh?: SnapshotRefresh<RecordRepresentation>
) {
    const fields = config.fields === undefined ? [] : config.fields;
    const optionalFields = config.optionalFields === undefined ? [] : config.optionalFields;

    const sel = buildRecordSelector(config.recordId, fields, optionalFields);
    return luvio.storeLookup<RecordRepresentation>(
        sel,
        refresh ? refresh : buildSnapshotRefresh(luvio, config)
    );
}

export function getRecordByFields(
    luvio: Luvio,
    config: GetRecordConfig
): Snapshot<RecordRepresentation> | Promise<Snapshot<RecordRepresentation>> {
    const snapshot = buildInMemorySnapshot(luvio, config);
    if (luvio.snapshotAvailable(snapshot)) {
        return snapshot;
    }

    return luvio.resolveSnapshot(snapshot, buildSnapshotRefresh(luvio, config));
}

export type BuildSnapshotContext = {
    config: GetRecordConfig;
    luvio: Luvio;
};

export function buildInMemorySnapshotCachePolicy(
    context: BuildSnapshotContext,
    storeLookup: StoreLookup<RecordRepresentation>
): Snapshot<RecordRepresentation> {
    const { config, luvio } = context;

    const fields = config.fields === undefined ? [] : config.fields;
    const optionalFields = config.optionalFields === undefined ? [] : config.optionalFields;

    const sel = buildRecordSelector(config.recordId, fields, optionalFields);
    return storeLookup(sel, buildSnapshotRefresh(luvio, config));
}

function buildNetworkSnapshotCachePolicy(
    context: BuildSnapshotContext
): Promise<Snapshot<RecordRepresentation>> {
    const { config, luvio } = context;

    return buildNetworkSnapshot(luvio, config);
}

export function getRecordByFields_requestContext(
    luvio: Luvio,
    config: GetRecordConfig,
    requestContext?: AdapterRequestContext
): Snapshot<RecordRepresentation> | Promise<Snapshot<RecordRepresentation>> {
    return luvio.applyCachePolicy(
        requestContext || {},
        { config, luvio },
        buildInMemorySnapshotCachePolicy,
        buildNetworkSnapshotCachePolicy
    );
}
