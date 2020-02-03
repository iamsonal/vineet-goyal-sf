import { NativeAdapter, AdapterFactory, LDS, FetchResponse } from '@salesforce-lds/engine';
import {
    getPicklistValuesNativeAdapterFactory,
    adapterName as getPicklistValuesAdapterName,
    validateAdapterConfig,
} from '../../generated/adapters/getPicklistValues';
import getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeIdAndFieldApiName from '../../generated/resources/getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeIdAndFieldApiName';
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

export const path = picklistValuesRepresentationSelect().selections;

function network(lds: LDS, config: GetPicklistValuesConfig) {
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
            return cache(lds, config);
        },
        (err: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(key, err);
            lds.storeBroadcast();
            return lds.errorSnapshot(err);
        }
    );
}

function cache(lds: LDS, config: GetPicklistValuesConfig) {
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

            const snapshot = cache(lds, config);
            if (isFulfilledSnapshot(snapshot)) {
                return snapshot;
            }

            return network(lds, config);
        },
        (untrusted: unknown) => {
            const config = validateAdapterConfig(untrusted, picklistValuesConfigPropertyNames);
            if (config === null) {
                throw new Error('Refresh should not be called with partial configuration');
            }

            return network(lds, config);
        }
    );
};

export const nativeFactory = (config: GetPicklistValuesConfig): NativeAdapter | null => {
    const fieldNames = getFieldId(config.fieldApiName);
    const nativeConfig = {
        objectApiName: fieldNames.objectApiName,
        fieldApiName: fieldNames.fieldApiName,
        recordTypeId: config.recordTypeId,
    };
    return getPicklistValuesNativeAdapterFactory(nativeConfig);
};
