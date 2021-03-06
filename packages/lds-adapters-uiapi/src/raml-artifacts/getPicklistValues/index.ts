import type {
    Luvio,
    FetchResponse,
    Snapshot,
    SnapshotRefresh,
    ResourceResponse,
    StoreLookup,
    CoercedAdapterRequestContext,
    DispatchResourceRequestContext,
} from '@luvio/engine';
import type { AdapterValidationConfig } from '../../generated/adapters/adapter-utils';
import { validateAdapterConfig as validateAdapterConfigOriginal } from '../../generated/adapters/getPicklistValues';
import getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeIdAndFieldApiName, {
    getResponseCacheKeys,
} from '../../generated/resources/getUiApiObjectInfoPicklistValuesByFieldApiNameAndObjectApiNameAndRecordTypeId';
import type { PicklistValuesRepresentation } from '../../generated/types/PicklistValuesRepresentation';
import {
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
    options?: DispatchResourceRequestContext
): Promise<Snapshot<PicklistValuesRepresentation>> {
    const { resourceParams, request, key } = buildRequestAndKey(config);

    return luvio.dispatchResourceRequest<PicklistValuesRepresentation>(request, options).then(
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

export function buildNetworkSnapshotCachePolicy(
    context: BuildSnapshotContext,
    coercedAdapterRequestContext: CoercedAdapterRequestContext
): Promise<Snapshot<PicklistValuesRepresentation, any>> {
    const { config, luvio } = context;
    const { networkPriority, requestCorrelator } = coercedAdapterRequestContext;

    const dispatchOptions: DispatchResourceRequestContext = {
        resourceRequestContext: {
            requestCorrelator,
        },
    };

    if (networkPriority !== 'normal') {
        dispatchOptions.overrides = {
            priority: networkPriority,
        };
    }
    return buildNetworkSnapshot(luvio, config, dispatchOptions);
}

export function buildCachedSnapshotCachePolicy(
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
    displayName: 'getPicklistValues',
    parameters: {
        required: ['recordTypeId', 'fieldApiName'],
        optional: [],
    },
};

export function validateAdapterConfig(untrusted: unknown, _config: AdapterValidationConfig) {
    return validateAdapterConfigOriginal(untrusted, picklistValuesConfigPropertyNames);
}
