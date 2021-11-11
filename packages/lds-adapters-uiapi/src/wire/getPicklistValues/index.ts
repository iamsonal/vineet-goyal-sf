import {
    AdapterFactory,
    Luvio,
    FetchResponse,
    Snapshot,
    SnapshotRefresh,
    ResourceResponse,
    DispatchResourceRequest,
    AdapterRequestContext,
    StoreLookup,
} from '@luvio/engine';
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
    const snapshot = buildInMemorySnapshot(luvio, config);
    luvio.storeBroadcast();
    return snapshot;
}

function onResponseError(
    luvio: Luvio,
    config: GetPicklistValuesConfig,
    key: string,
    err: FetchResponse<unknown>
) {
    const errorSnapshot = luvio.errorSnapshot(err, buildSnapshotRefresh(luvio, config));
    luvio.storeIngestError(key, errorSnapshot);
    luvio.storeBroadcast();
    return errorSnapshot;
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetPicklistValuesConfig
): Promise<Snapshot<PicklistValuesRepresentation>> {
    const { request, key } = buildRequestAndKey(config);

    return luvio.dispatchResourceRequest<PicklistValuesRepresentation>(request).then(
        (response) => {
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

type BuildSnapshotContext = {
    config: GetPicklistValuesConfig;
    luvio: Luvio;
};

function buildNetworkSnapshotCachePolicy(
    context: BuildSnapshotContext,
    // TODO [W-10034584]: remove unused dispatchResourceRequest parameter
    _dispatchResourceRequest: DispatchResourceRequest<PicklistValuesRepresentation>
): Promise<Snapshot<PicklistValuesRepresentation, any>> {
    const { config, luvio } = context;
    return buildNetworkSnapshot(luvio, config);
}

function buildInMemorySnapshotCachePolicy(
    context: BuildSnapshotContext,
    storeLookup: StoreLookup<PicklistValuesRepresentation>
): Snapshot<PicklistValuesRepresentation, any> {
    const { config, luvio } = context;

    const fieldNames = getFieldId(config.fieldApiName);
    const request = getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeIdAndFieldApiName({
        urlParams: {
            objectApiName: fieldNames.objectApiName,
            fieldApiName: fieldNames.fieldApiName,
            recordTypeId: config.recordTypeId,
        },
    });

    const key = picklistValuesKeyBuilder({ id: `${request.baseUri}${request.basePath}` });

    return storeLookup(
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
    function getPicklistValues(untrusted: unknown, requestContext?: AdapterRequestContext) {
        const config = validateAdapterConfig(untrusted, picklistValuesConfigPropertyNames);
        if (config === null) {
            return null;
        }

        // TODO [W-10164140]: get rid of this if check and always use luvio.applyCachePolicy
        if (requestContext !== undefined) {
            return luvio.applyCachePolicy(
                requestContext === undefined ? undefined : requestContext.cachePolicy,
                {
                    luvio,
                    config,
                },
                buildInMemorySnapshotCachePolicy,
                buildNetworkSnapshotCachePolicy
            );
        }

        const snapshot = buildInMemorySnapshot(luvio, config);
        if (luvio.snapshotAvailable(snapshot)) {
            return snapshot;
        }

        return luvio.resolveSnapshot(snapshot, buildSnapshotRefresh(luvio, config));
    };
