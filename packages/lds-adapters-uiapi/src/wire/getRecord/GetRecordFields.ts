import { LDS, Selector, Snapshot, FetchResponse, SnapshotRefresh } from '@ldsjs/engine';
import { GetRecordConfig } from '../../generated/adapters/getRecord';
import getUiApiRecordsByRecordId from '../../generated/resources/getUiApiRecordsByRecordId';
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

function buildRecordSelector(
    recordId: string,
    fields: string[],
    optionalFields: string[]
): Selector {
    return {
        recordId: recordRepresentationKeyBuilder({ recordId }),
        node: {
            kind: 'Fragment',
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

export function buildNetworkSnapshot(lds: LDS, config: GetRecordConfig) {
    const { recordId, fields } = config;

    // Should this go into the coersion logic?
    const allTrackedFields = getTrackedFields(lds, recordId, config.optionalFields);
    const request = getUiApiRecordsByRecordId({
        urlParams: {
            recordId,
        },
        queryParams: {
            fields,
            optionalFields:
                fields === undefined ? allTrackedFields : difference(allTrackedFields, fields),
        },
    });

    return lds.dispatchResourceRequest<RecordRepresentation>(request).then(
        response => {
            const { body } = response;
            const fields = config.fields === undefined ? [] : config.fields;
            const optionalFields = config.optionalFields === undefined ? [] : config.optionalFields;

            lds.storeIngest<RecordRepresentation>(request.key, request, body);

            const recordNode = lds.getNode<RecordRepresentationNormalized, RecordRepresentation>(
                request.key
            )!;

            markNulledOutRequiredFields(recordNode, [...fields, ...optionalFields]);
            markMissingOptionalFields(recordNode, allTrackedFields);

            lds.storeBroadcast();
            return lds.storeLookup<RecordRepresentation>(
                buildRecordSelector(config.recordId, fields, optionalFields),
                buildSnapshotRefresh(lds, config)
            );
        },
        (err: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(request.key, err, RecordRepresentationTTL);
            lds.storeBroadcast();
            return lds.errorSnapshot(err, buildSnapshotRefresh(lds, config));
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

    return buildNetworkSnapshot(lds, config);
}
