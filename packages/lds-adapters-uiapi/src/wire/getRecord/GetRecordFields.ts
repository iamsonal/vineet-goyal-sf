import {
    LDS,
    Selector,
    Snapshot,
    FetchResponse,
    SnapshotRefresh,
    UnfulfilledSnapshot,
    ResourceResponse,
    ResourceRequest,
} from '@ldsjs/engine';
import { GetRecordConfig, createResourceParams } from '../../generated/adapters/getRecord';
import {
    keyBuilder,
    createResourceRequest,
} from '../../generated/resources/getUiApiRecordsByRecordId';
import { TTL as RecordRepresentationTTL } from '../../generated/types/RecordRepresentation';
import {
    keyBuilder as recordRepresentationKeyBuilder,
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../../generated/types/RecordRepresentation';
import {
    getTrackedFields,
    markMissingOptionalFields,
    markNulledOutRequiredFields,
} from '../../util/records';
import { buildSelectionFromFields } from '../../selectors/record';
import { difference } from '../../validation/utils';
import { isUnfulfilledSnapshot } from '../../util/snapshot';

function buildRecordSelector(
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
    lds: LDS,
    config: GetRecordConfig
): SnapshotRefresh<RecordRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(lds, config),
    };
}

function prepareRequest(lds: LDS, config: GetRecordConfig) {
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

function onResourceSuccess(
    lds: LDS,
    config: GetRecordConfig,
    key: string,
    allTrackedFields: string[],
    request: ResourceRequest,
    response: ResourceResponse<RecordRepresentation>
) {
    const { body } = response;
    const fields = config.fields === undefined ? [] : config.fields;
    const optionalFields = config.optionalFields === undefined ? [] : config.optionalFields;

    // TODO: manual ingest.
    lds.storeIngest<RecordRepresentation>(key, request.ingest, body);

    const recordNode = lds.getNode<RecordRepresentationNormalized, RecordRepresentation>(key)!;

    markNulledOutRequiredFields(recordNode, [...fields, ...optionalFields]);
    markMissingOptionalFields(recordNode, allTrackedFields);

    lds.storeBroadcast();
    return lds.storeLookup<RecordRepresentation>(
        buildRecordSelector(config.recordId, fields, optionalFields),
        buildSnapshotRefresh(lds, config)
    );
}

function onResourceError(
    lds: LDS,
    config: GetRecordConfig,
    key: string,
    err: FetchResponse<unknown>
) {
    lds.storeIngestFetchResponse(key, err, RecordRepresentationTTL);
    lds.storeBroadcast();
    return lds.errorSnapshot(err, buildSnapshotRefresh(lds, config));
}

export function buildNetworkSnapshot(lds: LDS, config: GetRecordConfig) {
    const { request, key, allTrackedFields } = prepareRequest(lds, config);

    return lds.dispatchResourceRequest<RecordRepresentation>(request).then(
        response => {
            return onResourceSuccess(lds, config, key, allTrackedFields, request, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResourceError(lds, config, key, err);
        }
    );
}

export function resolveUnfulfilledSnapshot(
    lds: LDS,
    config: GetRecordConfig,
    snapshot: UnfulfilledSnapshot<RecordRepresentation, any>
) {
    const { request, key, allTrackedFields } = prepareRequest(lds, config);

    return lds.resolveUnfulfilledSnapshot<RecordRepresentation>(request, snapshot).then(
        response => {
            return onResourceSuccess(lds, config, key, allTrackedFields, request, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResourceError(lds, config, key, err);
        }
    );
}

// used by getRecordLayoutType#refresh
export function buildInMemorySnapshot(
    lds: LDS,
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
    lds: LDS,
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
