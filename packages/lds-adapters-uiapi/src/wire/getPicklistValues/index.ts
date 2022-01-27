import {
    AdapterFactory,
    Luvio,
    FetchResponse,
    Snapshot,
    SnapshotRefresh,
    ResourceResponse,
    AdapterRequestContext,
    StoreLookup,
    ResourceRequestOverride,
    CoercedAdapterRequestContext,
} from '@luvio/engine';
import {
    adapterName as getPicklistValuesAdapterName,
    validateAdapterConfig,
} from '../../generated/adapters/getPicklistValues';
import getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeIdAndFieldApiName, {
    getResponseCacheKeys,
} from '../../generated/resources/getUiApiObjectInfoPicklistValuesByFieldApiNameAndObjectApiNameAndRecordTypeId';
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
    const resourceParams = {
        urlParams: {
            objectApiName: fieldNames.objectApiName,
            fieldApiName: fieldNames.fieldApiName,
            recordTypeId,
        },
    };
    const request =
        getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeIdAndFieldApiName(
            resourceParams
        );

    const key = picklistValuesKeyBuilder({ id: `${request.baseUri}${request.basePath}` });
    return { resourceParams, request, key };
}

function onResponseSuccess(
    luvio: Luvio,
    config: GetPicklistValuesConfig,
    key: string,
    response: ResourceResponse<PicklistValuesRepresentation>
) {
    const { body } = response;
    luvio.storeIngest(key, picklistValuesRepresentationIngest, body);
    const snapshot = buildCachedSnapshot(luvio, config);
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
    config: GetPicklistValuesConfig,
    override?: ResourceRequestOverride
): Promise<Snapshot<PicklistValuesRepresentation>> {
    const { resourceParams, request, key } = buildRequestAndKey(config);

    return luvio.dispatchResourceRequest<PicklistValuesRepresentation>(request, override).then(
        (response) => {
            return luvio.handleSuccessResponse(
                () => {
                    return onResponseSuccess(luvio, config, key, response);
                },
                () => {
                    return getResponseCacheKeys(resourceParams, response.body);
                }
            );
        },
        (err: FetchResponse<unknown>) => {
            return luvio.handleErrorResponse(() => {
                return onResponseError(luvio, config, key, err);
            });
        }
    );
}

export function buildCachedSnapshot(luvio: Luvio, config: GetPicklistValuesConfig) {
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
    requestContext: CoercedAdapterRequestContext
): Promise<Snapshot<PicklistValuesRepresentation, any>> {
    const { config, luvio } = context;
    let override = undefined;
    const { networkPriority } = requestContext;
    if (networkPriority !== 'normal') {
        override = {
            priority: networkPriority,
        };
    }
    return buildNetworkSnapshot(luvio, config, override);
}

function buildCachedSnapshotCachePolicy(
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

        return luvio.applyCachePolicy(
            requestContext || {},
            {
                luvio,
                config,
            },
            buildCachedSnapshotCachePolicy,
            buildNetworkSnapshotCachePolicy
        );
    };
