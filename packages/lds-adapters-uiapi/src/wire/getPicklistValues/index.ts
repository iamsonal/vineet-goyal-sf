import { AdapterFactory, LDS, FetchResponse, Snapshot, SnapshotRefresh } from '@ldsjs/engine';
import {
    adapterName as getPicklistValuesAdapterName,
    validateAdapterConfig,
} from '../../generated/adapters/getPicklistValues';
import getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeIdAndFieldApiName from '../../generated/resources/getUiApiObjectInfoPicklistValuesByFieldApiNameAndObjectApiNameAndRecordTypeId';
import {
    PicklistValuesRepresentation,
    keyBuilder as picklistValuesKeyBuilder,
    select as picklistValuesRepresentationSelect,
} from '../../generated/types/PicklistValuesRepresentation';
import { getFieldId } from '../../primitives/FieldId';

export interface GetPicklistValuesConfig {
    recordTypeId: string;
    fieldApiName: string;
}

const path = picklistValuesRepresentationSelect().selections;

function buildSnapshotRefresh(
    lds: LDS,
    config: GetPicklistValuesConfig
): SnapshotRefresh<PicklistValuesRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(lds, config),
    };
}

export function buildNetworkSnapshot(
    lds: LDS,
    config: GetPicklistValuesConfig
): Promise<Snapshot<PicklistValuesRepresentation>> {
    const { recordTypeId, fieldApiName } = config;
    const fieldNames = getFieldId(fieldApiName);
    const request = getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeIdAndFieldApiName({
        urlParams: {
            objectApiName: fieldNames.objectApiName,
            fieldApiName: fieldNames.fieldApiName,
            recordTypeId,
        },
    });
    const key = picklistValuesKeyBuilder({ id: request.path });

    return lds.dispatchResourceRequest<PicklistValuesRepresentation>(request).then(
        response => {
            const { body } = response;

            lds.storeIngest(key, request, body);
            lds.storeBroadcast();
            return buildInMemorySnapshot(lds, config);
        },
        (err: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(key, err);
            lds.storeBroadcast();
            return lds.errorSnapshot(err, buildSnapshotRefresh(lds, config));
        }
    );
}

export function buildInMemorySnapshot(lds: LDS, config: GetPicklistValuesConfig) {
    const fieldNames = getFieldId(config.fieldApiName);
    const request = getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeIdAndFieldApiName({
        urlParams: {
            objectApiName: fieldNames.objectApiName,
            fieldApiName: fieldNames.fieldApiName,
            recordTypeId: config.recordTypeId,
        },
    });
    const key = picklistValuesKeyBuilder({ id: request.path });

    return lds.storeLookup<PicklistValuesRepresentation>(
        {
            recordId: key,
            node: {
                kind: 'Fragment',
                selections: path,
            },
            variables: {},
        },
        buildSnapshotRefresh(lds, config)
    );
}

const picklistValuesConfigPropertyNames = {
    displayName: getPicklistValuesAdapterName,
    parameters: {
        required: ['recordTypeId', 'fieldApiName'],
        optional: [],
    },
};

export const factory: AdapterFactory<GetPicklistValuesConfig, PicklistValuesRepresentation> = (
    lds: LDS
) =>
    function getPicklistValues(untrusted: unknown) {
        const config = validateAdapterConfig(untrusted, picklistValuesConfigPropertyNames);
        if (config === null) {
            return null;
        }

        const snapshot = buildInMemorySnapshot(lds, config);
        if (lds.snapshotDataAvailable(snapshot)) {
            return snapshot;
        }

        return buildNetworkSnapshot(lds, config);
    };
