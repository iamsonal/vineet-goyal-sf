import { AdapterFactory, LDS, FetchResponse } from '@ldsjs/engine';
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
import { isFulfilledSnapshot } from '../../util/snapshot';
import { refreshable } from '../../generated/adapters/adapter-utils';

export interface GetPicklistValuesConfig {
    recordTypeId: string;
    fieldApiName: string;
}

const path = picklistValuesRepresentationSelect().selections;

export function buildNetworkSnapshot(lds: LDS, config: GetPicklistValuesConfig) {
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
            return lds.errorSnapshot(err);
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

    return lds.storeLookup<PicklistValuesRepresentation>({
        recordId: key,
        node: {
            kind: 'Fragment',
            selections: path,
        },
        variables: {},
    });
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
) => {
    return refreshable(
        function(untrusted: unknown) {
            const config = validateAdapterConfig(untrusted, picklistValuesConfigPropertyNames);
            if (config === null) {
                return null;
            }

            const snapshot = buildInMemorySnapshot(lds, config);
            if (isFulfilledSnapshot(snapshot)) {
                return snapshot;
            }

            return buildNetworkSnapshot(lds, config);
        },
        (untrusted: unknown) => {
            const config = validateAdapterConfig(untrusted, picklistValuesConfigPropertyNames);
            if (config === null) {
                throw new Error('Refresh should not be called with partial configuration');
            }

            return buildNetworkSnapshot(lds, config);
        }
    );
};
