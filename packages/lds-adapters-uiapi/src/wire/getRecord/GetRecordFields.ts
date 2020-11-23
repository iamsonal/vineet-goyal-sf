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
    lds: Luvio,
    config: GetRecordConfig
): SnapshotRefresh<RecordRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(lds, config),
    };
}

function prepareRequest(lds: Luvio, config: GetRecordConfig) {
    const { recordId, fields } = config;

    // Should this go into the coersion logic?
    const allTrackedFields = getTrackedFields(lds, recordId, config.optionalFields);
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
    lds: Luvio,
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
    lds.storeIngest<RecordRepresentation>(key, recordIngest, body);

    resolveConflict(lds, recordConflict);

    const recordNode = lds.getNode<RecordRepresentationNormalized, RecordRepresentation>(key)!;
    markMissingOptionalFields(recordNode, allTrackedFields);

    return lds.storeLookup<RecordRepresentation>(
        buildRecordSelector(config.recordId, fields, optionalFields),
        buildSnapshotRefresh(lds, config)
    );
}

function onResourceSuccess(
    lds: Luvio,
    config: GetRecordConfig,
    key: string,
    allTrackedFields: string[],
    response: ResourceResponse<RecordRepresentation>
) {
    const snapshot = ingestSuccess(lds, config, key, allTrackedFields, response);
    lds.storeBroadcast();
    return snapshot;
}

export function ingestError(
    lds: Luvio,
    config: GetRecordConfig,
    key: string,
    err: FetchResponse<unknown>
) {
    lds.storeIngestFetchResponse(key, err, RecordRepresentationTTL);
    return lds.errorSnapshot(err, buildSnapshotRefresh(lds, config));
}

function onResourceError(
    lds: Luvio,
    config: GetRecordConfig,
    key: string,
    err: FetchResponse<unknown>
) {
    const errorSnapshot = ingestError(lds, config, key, err);
    lds.storeBroadcast();
    return errorSnapshot;
}

export function buildNetworkSnapshot(lds: Luvio, config: GetRecordConfig) {
    const { request, key, allTrackedFields } = prepareRequest(lds, config);

    return lds.dispatchResourceRequest<RecordRepresentation>(request).then(
        response => {
            return onResourceSuccess(lds, config, key, allTrackedFields, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResourceError(lds, config, key, err);
        }
    );
}

export function resolveUnfulfilledSnapshot(
    lds: Luvio,
    config: GetRecordConfig,
    snapshot: UnfulfilledSnapshot<RecordRepresentation, any>
) {
    const { request, key, allTrackedFields } = prepareRequest(lds, config);

    return lds.resolveUnfulfilledSnapshot<RecordRepresentation>(request, snapshot).then(
        response => {
            return onResourceSuccess(lds, config, key, allTrackedFields, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResourceError(lds, config, key, err);
        }
    );
}

// used by getRecordLayoutType#refresh
export function buildInMemorySnapshot(
    lds: Luvio,
    config: GetRecordConfig,
    refresh?: SnapshotRefresh<RecordRepresentation>
) {
    const fields = config.fields === undefined ? [] : config.fields;
    const optionalFields = config.optionalFields === undefined ? [] : config.optionalFields;

    const sel = buildRecordSelector(config.recordId, fields, optionalFields);
    return lds.storeLookup<RecordRepresentation>(
        sel,
        refresh ? refresh : buildSnapshotRefresh(lds, config)
    );
}

export function getRecordByFields(
    lds: Luvio,
    config: GetRecordConfig
): Snapshot<RecordRepresentation> | Promise<Snapshot<RecordRepresentation>> {
    const snapshot = buildInMemorySnapshot(lds, config);
    if (lds.snapshotDataAvailable(snapshot)) {
        return snapshot;
    }

    if (isUnfulfilledSnapshot(snapshot)) {
        return resolveUnfulfilledSnapshot(lds, config, snapshot);
    }

    return buildNetworkSnapshot(lds, config);
}
