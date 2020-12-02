import {
    Luvio,
    Selector,
    Snapshot,
    FetchResponse,
    SnapshotRefresh,
    UnfulfilledSnapshot,
    ResourceResponse,
} from '@luvio/engine';
import { GetRecordConfig, createResourceParams } from '../../generated/adapters/getRecord';
import { keyBuilder } from '../../generated/resources/getUiApiRecordsByRecordId';
import { createResourceRequest } from '../../raml-artifacts/resources/getUiApiRecordsByRecordId/createResourceRequest';
import { TTL as RecordRepresentationTTL } from '../../generated/types/RecordRepresentation';
import {
    keyBuilder as recordRepresentationKeyBuilder,
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../../generated/types/RecordRepresentation';
import {
    getTrackedFields,
    markMissingOptionalFields,
    convertFieldsToTrie,
} from '../../util/records';
import { buildSelectionFromFields } from '../../selectors/record';
import { difference } from '../../validation/utils';
import { isUnfulfilledSnapshot } from '../../util/snapshot';
import { createRecordIngest } from '../../util/record-ingest';
import {
    RecordConflictMap,
    resolveConflict,
} from '../../helpers/RecordRepresentation/resolveConflict';

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
    const allTrackedFields = getTrackedFields(luvio, recordId, config.optionalFields);
    const optionalFields =
        fields === undefined ? allTrackedFields : difference(allTrackedFields, fields);
    const params = createResourceParams({
        recordId,
        fields,
        optionalFields: optionalFields.length > 0 ? optionalFields : undefined,
    });
    const request = createResourceRequest(params);
    const key = keyBuilder(params);

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
    const optionalFieldTrie = convertFieldsToTrie(optionalFields, true);
    const recordConflict: RecordConflictMap = {} as RecordConflictMap;
    const recordIngest = createRecordIngest(fieldTrie, optionalFieldTrie, recordConflict);
    luvio.storeIngest<RecordRepresentation>(key, recordIngest, body);

    resolveConflict(luvio, recordConflict);

    const recordNode = luvio.getNode<RecordRepresentationNormalized, RecordRepresentation>(key)!;
    markMissingOptionalFields(recordNode, allTrackedFields);

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
    luvio.storeIngestFetchResponse(key, err, RecordRepresentationTTL);
    return luvio.errorSnapshot(err, buildSnapshotRefresh(luvio, config));
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
        response => {
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
        response => {
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
    if (luvio.snapshotDataAvailable(snapshot)) {
        return snapshot;
    }

    if (isUnfulfilledSnapshot(snapshot)) {
        return resolveUnfulfilledSnapshot(luvio, config, snapshot);
    }

    return buildNetworkSnapshot(luvio, config);
}
