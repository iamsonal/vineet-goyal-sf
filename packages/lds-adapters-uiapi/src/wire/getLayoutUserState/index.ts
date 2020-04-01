import { AdapterFactory, LDS, FetchResponse, Snapshot, SnapshotRefresh } from '@ldsjs/engine';
import {
    GetLayoutUserStateConfig,
    validateAdapterConfig,
} from '../../generated/adapters/getLayoutUserState';
import {
    RecordLayoutUserStateRepresentation,
    keyBuilder,
} from '../../generated/types/RecordLayoutUserStateRepresentation';
import { default as resources_getUiApiLayoutUserStateByObjectApiName_default } from '../../generated/resources/getUiApiLayoutUserStateByObjectApiName';
import { LayoutMode } from '../../primitives/LayoutMode';
import { LayoutType } from '../../primitives/LayoutType';
import { AdapterValidationConfig } from '../../generated/adapters/adapter-utils';
import { select as recordLayoutUserStateRepresentationSelect } from '../../generated/types/RecordLayoutUserStateRepresentation';

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

    return lds.dispatchResourceRequest<RecordLayoutUserStateRepresentation>(request).then(
        response => {
            const { body } = response;
            // Hack- adding in this params so record-ui will be able to use normed values.
            body.apiName = config.objectApiName;
            body.recordTypeId = recordTypeId;
            body.layoutType = layoutType;
            body.mode = mode;
            lds.storeIngest<RecordLayoutUserStateRepresentation>(key, request, body);
            lds.storeBroadcast();
            return buildInMemorySnapshot(lds, config);
        },
        (error: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(key, error);
            lds.storeBroadcast();
            return lds.errorSnapshot(error, buildSnapshotRefresh(lds, config));
        }
    );
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

        return buildNetworkSnapshot(lds, config);
    };
