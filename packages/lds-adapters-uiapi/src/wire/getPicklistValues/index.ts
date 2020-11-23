import {
    AdapterFactory,
    Luvio,
    FetchResponse,
    Snapshot,
    SnapshotRefresh,
    ResourceResponse,
    UnfulfilledSnapshot,
} from '@luvio/engine';
import { isUnfulfilledSnapshot } from '../../util/snapshot';
import {
    adapterName as getPicklistValuesAdapterName,
    validateAdapterConfig,
} from '../../generated/adapters/getPicklistValues';
import getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeIdAndFieldApiName from '../../generated/resources/getUiApiObjectInfoPicklistValuesByFieldApiNameAndObjectApiNameAndRecordTypeId';
import {
    PicklistValuesRepresentation,
    keyBuilder as picklistValuesKeyBuilder,
    select as picklistValuesRepresentationSelect,
    ingest as picklistValuesRepresentationIngest,
} from '../../generated/types/PicklistValuesRepresentation';
import { getFieldId } from '../../primitives/FieldId';

export interface GetPicklistValuesConfig {
    recordTypeId: string;
    fieldApiName: string;
}

const path = picklistValuesRepresentationSelect().selections;

function buildSnapshotRefresh(
    lds: Luvio,
    config: GetPicklistValuesConfig
): SnapshotRefresh<PicklistValuesRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(lds, config),
    };
}

function buildRequestAndKey(config: GetPicklistValuesConfig) {
    const { recordTypeId, fieldApiName } = config;
    const fieldNames = getFieldId(fieldApiName);
    const request = getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeIdAndFieldApiName({
        urlParams: {
            objectApiName: fieldNames.objectApiName,
            fieldApiName: fieldNames.fieldApiName,
            recordTypeId,
        },
    });

    const key = picklistValuesKeyBuilder({ id: `${request.baseUri}${request.basePath}` });
    return { request, key };
}

function onResponseSuccess(
    lds: Luvio,
    config: GetPicklistValuesConfig,
    key: string,
    response: ResourceResponse<PicklistValuesRepresentation>
) {
    const { body } = response;
    lds.storeIngest(key, picklistValuesRepresentationIngest, body);
    lds.storeBroadcast();
    return buildInMemorySnapshot(lds, config);
}

function onResponseError(
    lds: Luvio,
    config: GetPicklistValuesConfig,
    key: string,
    err: FetchResponse<unknown>
) {
    lds.storeIngestFetchResponse(key, err);
    lds.storeBroadcast();
    return lds.errorSnapshot(err, buildSnapshotRefresh(lds, config));
}

export function buildNetworkSnapshot(
    lds: Luvio,
    config: GetPicklistValuesConfig
): Promise<Snapshot<PicklistValuesRepresentation>> {
    const { request, key } = buildRequestAndKey(config);

    return lds.dispatchResourceRequest<PicklistValuesRepresentation>(request).then(
        response => {
            return onResponseSuccess(lds, config, key, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResponseError(lds, config, key, err);
        }
    );
}

export function resolveUnfulfilledSnapshot(
    lds: Luvio,
    config: GetPicklistValuesConfig,
    snapshot: UnfulfilledSnapshot<PicklistValuesRepresentation, any>
): Promise<Snapshot<PicklistValuesRepresentation>> {
    const { request, key } = buildRequestAndKey(config);

    return lds.resolveUnfulfilledSnapshot<PicklistValuesRepresentation>(request, snapshot).then(
        response => {
            return onResponseSuccess(lds, config, key, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResponseError(lds, config, key, err);
        }
    );
}

export function buildInMemorySnapshot(lds: Luvio, config: GetPicklistValuesConfig) {
    const fieldNames = getFieldId(config.fieldApiName);
    const request = getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeIdAndFieldApiName({
        urlParams: {
            objectApiName: fieldNames.objectApiName,
            fieldApiName: fieldNames.fieldApiName,
            recordTypeId: config.recordTypeId,
        },
    });

    const key = picklistValuesKeyBuilder({ id: `${request.baseUri}${request.basePath}` });

    return lds.storeLookup<PicklistValuesRepresentation>(
        {
            recordId: key,
            node: {
                kind: 'Fragment',
                private: ['eTag'],
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
    lds: Luvio
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

        if (isUnfulfilledSnapshot(snapshot)) {
            return resolveUnfulfilledSnapshot(lds, config, snapshot);
        }

        return buildNetworkSnapshot(lds, config);
    };
