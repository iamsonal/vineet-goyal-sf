import {
    Luvio,
    Selector,
    Snapshot,
    FetchResponse,
    SnapshotRefresh,
    UnfulfilledSnapshot,
    ResourceResponse,
    ResourceRequest,
} from '@luvio/engine';
import { GetRecordConfig, createResourceParams } from '../../generated/adapters/getRecord';
import {
    keyBuilder,
    ResourceRequestConfig,
} from '../../generated/resources/getUiApiRecordsByRecordId';
import { createResourceRequest } from '../../raml-artifacts/resources/getUiApiRecordsByRecordId/createResourceRequest';
import { TTL as RecordRepresentationTTL } from '../../generated/types/RecordRepresentation';
import {
    keyBuilder as recordRepresentationKeyBuilder,
    RecordRepresentation,
} from '../../generated/types/RecordRepresentation';
import {
    getTrackedFields,
    convertFieldsToTrie,
    ResourceRequestWithConfig,
} from '../../util/records';
import { buildSelectionFromFields } from '../../selectors/record';
import { difference } from '../../validation/utils';
import { isUnfulfilledSnapshot } from '../../util/snapshot';
import { createFieldsIngestSuccess as getRecordsResourceIngest } from '../../generated/fields/resources/getUiApiRecordsByRecordId';
import { configuration } from '../../configuration';

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
    const { recordId, fields, optionalFields: optionalFieldsFromConfig } = config;

    // Should this go into the coersion logic?
    const key = keyBuilder(createResourceParams(config));

    const allTrackedFields = getTrackedFields(
        key,
        luvio.getNode(key),
        {
            maxDepth: configuration.getTrackedFieldDepthOnCacheMiss(),
            onlyFetchLeafNodeId: configuration.getTrackedFieldLeafNodeIdOnly(),
        },
        optionalFieldsFromConfig
    );
    const allOptionalFields =
        fields === undefined ? allTrackedFields : difference(allTrackedFields, fields);
    const params: ResourceRequestConfig = createResourceParams({
        recordId,
        fields,
        optionalFields: allOptionalFields.length > 0 ? allOptionalFields : undefined,
    });

    const request = createResourceRequest(params) as ResourceRequest & ResourceRequestWithConfig;
    request.configOptionalFields = optionalFieldsFromConfig;

    return { request, key, allTrackedFields };
}

export function ingestSuccess(
    luvio: Luvio,
    config: GetRecordConfig,
    key: string,
    allTrackedFields: string[],
    response: ResourceResponse<RecordRepresentation>
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
    response: ResourceResponse<RecordRepresentation>
) {
    const snapshot = ingestSuccess(luvio, config, key, allTrackedFields, response);
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
    luvio.storeIngestError(key, errorSnapshot, RecordRepresentationTTL);
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

export function buildNetworkSnapshot(luvio: Luvio, config: GetRecordConfig) {
    const { request, key, allTrackedFields } = prepareRequest(luvio, config);

    return luvio.dispatchResourceRequest<RecordRepresentation>(request).then(
        (response) => {
            return onResourceSuccess(luvio, config, key, allTrackedFields, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResourceError(luvio, config, key, err);
        }
    );
}

export function resolveUnfulfilledSnapshot(
    luvio: Luvio,
    config: GetRecordConfig,
    snapshot: UnfulfilledSnapshot<RecordRepresentation, any>
) {
    const { request, key, allTrackedFields } = prepareRequest(luvio, config);

    return luvio.resolveUnfulfilledSnapshot<RecordRepresentation>(request, snapshot).then(
        (response) => {
            return onResourceSuccess(luvio, config, key, allTrackedFields, response);
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

    if (isUnfulfilledSnapshot(snapshot)) {
        return resolveUnfulfilledSnapshot(luvio, config, snapshot);
    }

    return buildNetworkSnapshot(luvio, config);
}
