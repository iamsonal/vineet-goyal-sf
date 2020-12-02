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
    luvio: Luvio,
    config: GetPicklistValuesConfig
): SnapshotRefresh<PicklistValuesRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config),
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
    luvio: Luvio,
    config: GetPicklistValuesConfig,
    key: string,
    response: ResourceResponse<PicklistValuesRepresentation>
) {
    const { body } = response;
    luvio.storeIngest(key, picklistValuesRepresentationIngest, body);
    luvio.storeBroadcast();
    return buildInMemorySnapshot(luvio, config);
}

function onResponseError(
    luvio: Luvio,
    config: GetPicklistValuesConfig,
    key: string,
    err: FetchResponse<unknown>
) {
    luvio.storeIngestFetchResponse(key, err);
    luvio.storeBroadcast();
    return luvio.errorSnapshot(err, buildSnapshotRefresh(luvio, config));
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetPicklistValuesConfig
): Promise<Snapshot<PicklistValuesRepresentation>> {
    const { request, key } = buildRequestAndKey(config);

    return luvio.dispatchResourceRequest<PicklistValuesRepresentation>(request).then(
        response => {
            return onResponseSuccess(luvio, config, key, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResponseError(luvio, config, key, err);
        }
    );
}

export function resolveUnfulfilledSnapshot(
    luvio: Luvio,
    config: GetPicklistValuesConfig,
    snapshot: UnfulfilledSnapshot<PicklistValuesRepresentation, any>
): Promise<Snapshot<PicklistValuesRepresentation>> {
    const { request, key } = buildRequestAndKey(config);

    return luvio.resolveUnfulfilledSnapshot<PicklistValuesRepresentation>(request, snapshot).then(
        response => {
            return onResponseSuccess(luvio, config, key, response);
        },
        (err: FetchResponse<unknown>) => {
            return onResponseError(luvio, config, key, err);
        }
    );
}

export function buildInMemorySnapshot(luvio: Luvio, config: GetPicklistValuesConfig) {
    const fieldNames = getFieldId(config.fieldApiName);
    const request = getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeIdAndFieldApiName({
        urlParams: {
            objectApiName: fieldNames.objectApiName,
            fieldApiName: fieldNames.fieldApiName,
            recordTypeId: config.recordTypeId,
        },
    });

    const key = picklistValuesKeyBuilder({ id: `${request.baseUri}${request.basePath}` });

    return luvio.storeLookup<PicklistValuesRepresentation>(
        {
            recordId: key,
            node: {
                kind: 'Fragment',
                private: ['eTag'],
                selections: path,
            },
            variables: {},
        },
        buildSnapshotRefresh(luvio, config)
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
    luvio: Luvio
) =>
    function getPicklistValues(untrusted: unknown) {
        const config = validateAdapterConfig(untrusted, picklistValuesConfigPropertyNames);
        if (config === null) {
            return null;
        }

        const snapshot = buildInMemorySnapshot(luvio, config);
        if (luvio.snapshotDataAvailable(snapshot)) {
            return snapshot;
        }

        if (isUnfulfilledSnapshot(snapshot)) {
            return resolveUnfulfilledSnapshot(luvio, config, snapshot);
        }

        return buildNetworkSnapshot(luvio, config);
    };
