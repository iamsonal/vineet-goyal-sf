import {
    AdapterFactory,
    Luvio,
    FetchResponse,
    Snapshot,
    SnapshotRefresh,
    UnfulfilledSnapshot,
    ResourceResponse,
} from '@luvio/engine';
import {
    GetLayoutUserStateConfig,
    validateAdapterConfig,
} from '../../generated/adapters/getLayoutUserState';
import {
    RecordLayoutUserStateRepresentation,
    keyBuilder,
    select as recordLayoutUserStateRepresentationSelect,
    ingest as recordLayoutUserStateRepresentationIngest,
} from '../../generated/types/RecordLayoutUserStateRepresentation';
import { default as resources_getUiApiLayoutUserStateByObjectApiName_default } from '../../generated/resources/getUiApiLayoutUserStateByObjectApiName';
import { LayoutMode } from '../../primitives/LayoutMode';
import { LayoutType } from '../../primitives/LayoutType';
import { AdapterValidationConfig } from '../../generated/adapters/adapter-utils';
import { isUnfulfilledSnapshot } from '../../util/snapshot';

const recordLayoutSelect = recordLayoutUserStateRepresentationSelect();

export type GetLayoutUserStateConfigWithDefaults = Omit<
    Required<GetLayoutUserStateConfig>,
    'formFactor'
>;

// FYI stricter required set than RAML defines, matches lds222 behavior
export const getLayoutUserState_ConfigPropertyNames: AdapterValidationConfig = {
    displayName: 'getLayoutUserState',
    parameters: {
        required: ['objectApiName', 'recordTypeId'],
        optional: ['formFactor', 'layoutType', 'mode'],
    },
};

export function coerceConfigWithDefaults(
    untrustedConfig: unknown
): GetLayoutUserStateConfigWithDefaults | null {
    const config = validateAdapterConfig(untrustedConfig, getLayoutUserState_ConfigPropertyNames);
    if (config === null) {
        return null;
    }

    // recordTypeId is overridden to be required
    const recordTypeId = config.recordTypeId!;

    const untrusted = untrustedConfig as GetLayoutUserStateConfig;
    let layoutType = config.layoutType;
    if (layoutType === undefined) {
        if (untrusted.layoutType === undefined) {
            layoutType = LayoutType.Full;
        } else {
            return null;
        }
    }

    let mode = config.mode;
    if (mode === undefined) {
        if (untrusted.mode === undefined) {
            mode = LayoutMode.View;
        } else {
            return null;
        }
    }

    return {
        ...config,
        recordTypeId,
        layoutType,
        mode,
    };
}

function buildSnapshotRefresh(
    luvio: Luvio,
    config: GetLayoutUserStateConfigWithDefaults
): SnapshotRefresh<RecordLayoutUserStateRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config),
    };
}

export function buildInMemorySnapshot(luvio: Luvio, config: GetLayoutUserStateConfigWithDefaults) {
    const { objectApiName, recordTypeId, layoutType, mode } = config;
    const key = keyBuilder({
        apiName: objectApiName,
        recordTypeId,
        layoutType,
        mode,
    });

    return luvio.storeLookup<RecordLayoutUserStateRepresentation>(
        {
            recordId: key,
            node: recordLayoutSelect,
            variables: {},
        },
        buildSnapshotRefresh(luvio, config)
    );
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetLayoutUserStateConfigWithDefaults
): Promise<Snapshot<RecordLayoutUserStateRepresentation>> {
    const { request, key } = prepareRequest(config);

    return luvio.dispatchResourceRequest<RecordLayoutUserStateRepresentation>(request).then(
        response => {
            return onResourceResponseSuccess(luvio, config, key, response);
        },
        (error: FetchResponse<unknown>) => {
            return onResourceResponseError(luvio, config, key, error);
        }
    );
}

function resolveUnfulfilledSnapshot(
    luvio: Luvio,
    config: GetLayoutUserStateConfigWithDefaults,
    snapshot: UnfulfilledSnapshot<RecordLayoutUserStateRepresentation, any>
) {
    const { request, key } = prepareRequest(config);

    return luvio
        .resolveUnfulfilledSnapshot<RecordLayoutUserStateRepresentation>(request, snapshot)
        .then(
            response => {
                return onResourceResponseSuccess(luvio, config, key, response);
            },
            (error: FetchResponse<unknown>) => {
                return onResourceResponseError(luvio, config, key, error);
            }
        );
}

function onResourceResponseSuccess(
    luvio: Luvio,
    config: GetLayoutUserStateConfigWithDefaults,
    key: string,
    response: ResourceResponse<RecordLayoutUserStateRepresentation>
) {
    const { body } = response;
    const { recordTypeId, layoutType, mode } = config;
    // Hack- adding in this params so record-ui will be able to use normed values.
    body.apiName = config.objectApiName;
    body.recordTypeId = recordTypeId;
    body.layoutType = layoutType;
    body.mode = mode;
    luvio.storeIngest<RecordLayoutUserStateRepresentation>(
        key,
        recordLayoutUserStateRepresentationIngest,
        body
    );
    luvio.storeBroadcast();
    return buildInMemorySnapshot(luvio, config);
}

function onResourceResponseError(
    luvio: Luvio,
    config: GetLayoutUserStateConfigWithDefaults,
    key: string,
    error: FetchResponse<unknown>
) {
    luvio.storeIngestFetchResponse(key, error);
    luvio.storeBroadcast();
    return luvio.errorSnapshot(error, buildSnapshotRefresh(luvio, config));
}

function prepareRequest(config: GetLayoutUserStateConfigWithDefaults) {
    const { recordTypeId, layoutType, mode, objectApiName } = config;
    const key = keyBuilder({
        apiName: objectApiName,
        recordTypeId,
        layoutType,
        mode,
    });

    const request = resources_getUiApiLayoutUserStateByObjectApiName_default({
        urlParams: { objectApiName: config.objectApiName },
        queryParams: {
            layoutType: config.layoutType,
            mode: config.mode,
            recordTypeId: config.recordTypeId,
        },
    });

    return { request, key };
}

export const factory: AdapterFactory<
    GetLayoutUserStateConfig,
    RecordLayoutUserStateRepresentation
> = (luvio: Luvio) =>
    function getLayoutUserState(untrustedConfig: unknown) {
        const config = coerceConfigWithDefaults(untrustedConfig);
        if (config === null) {
            return null;
        }

        const cacheSnapshot = buildInMemorySnapshot(luvio, config);
        // Cache Hit
        if (luvio.snapshotAvailable(cacheSnapshot)) {
            return cacheSnapshot;
        }

        if (isUnfulfilledSnapshot(cacheSnapshot)) {
            return resolveUnfulfilledSnapshot(luvio, config, cacheSnapshot);
        }

        return buildNetworkSnapshot(luvio, config);
    };
