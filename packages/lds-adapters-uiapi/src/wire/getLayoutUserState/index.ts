import {
    AdapterFactory,
    LDS,
    FetchResponse,
    Snapshot,
    SnapshotRefresh,
    UnfulfilledSnapshot,
    ResourceResponse,
} from '@ldsjs/engine';
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
    lds: LDS,
    config: GetLayoutUserStateConfigWithDefaults
): SnapshotRefresh<RecordLayoutUserStateRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(lds, config),
    };
}

export function buildInMemorySnapshot(lds: LDS, config: GetLayoutUserStateConfigWithDefaults) {
    const { objectApiName, recordTypeId, layoutType, mode } = config;
    const key = keyBuilder({
        apiName: objectApiName,
        recordTypeId,
        layoutType,
        mode,
    });

    return lds.storeLookup<RecordLayoutUserStateRepresentation>(
        {
            recordId: key,
            node: recordLayoutSelect,
            variables: {},
        },
        buildSnapshotRefresh(lds, config)
    );
}

export function buildNetworkSnapshot(
    lds: LDS,
    config: GetLayoutUserStateConfigWithDefaults
): Promise<Snapshot<RecordLayoutUserStateRepresentation>> {
    const { request, key } = prepareRequest(config);

    return lds.dispatchResourceRequest<RecordLayoutUserStateRepresentation>(request).then(
        response => {
            return onResourceResponseSuccess(lds, config, key, response);
        },
        (error: FetchResponse<unknown>) => {
            return onResourceResponseError(lds, config, key, error);
        }
    );
}

function resolveUnfulfilledSnapshot(
    lds: LDS,
    config: GetLayoutUserStateConfigWithDefaults,
    snapshot: UnfulfilledSnapshot<RecordLayoutUserStateRepresentation, any>
) {
    const { request, key } = prepareRequest(config);

    return lds
        .resolveUnfulfilledSnapshot<RecordLayoutUserStateRepresentation>(request, snapshot)
        .then(
            response => {
                return onResourceResponseSuccess(lds, config, key, response);
            },
            (error: FetchResponse<unknown>) => {
                return onResourceResponseError(lds, config, key, error);
            }
        );
}

function onResourceResponseSuccess(
    lds: LDS,
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
    lds.storeIngest<RecordLayoutUserStateRepresentation>(
        key,
        recordLayoutUserStateRepresentationIngest,
        body
    );
    lds.storeBroadcast();
    return buildInMemorySnapshot(lds, config);
}

function onResourceResponseError(
    lds: LDS,
    config: GetLayoutUserStateConfigWithDefaults,
    key: string,
    error: FetchResponse<unknown>
) {
    lds.storeIngestFetchResponse(key, error);
    lds.storeBroadcast();
    return lds.errorSnapshot(error, buildSnapshotRefresh(lds, config));
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
> = (lds: LDS) =>
    function getLayoutUserState(untrustedConfig: unknown) {
        const config = coerceConfigWithDefaults(untrustedConfig);
        if (config === null) {
            return null;
        }

        const cacheSnapshot = buildInMemorySnapshot(lds, config);
        // Cache Hit
        if (lds.snapshotDataAvailable(cacheSnapshot)) {
            return cacheSnapshot;
        }

        if (isUnfulfilledSnapshot(cacheSnapshot)) {
            return resolveUnfulfilledSnapshot(lds, config, cacheSnapshot);
        }

        return buildNetworkSnapshot(lds, config);
    };
