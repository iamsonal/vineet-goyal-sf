import {
    AdapterFactory,
    LDS,
    Snapshot,
    ResourceRequestOverride,
    FetchResponse,
    SnapshotRefresh,
} from '@ldsjs/engine';
import {
    AdapterValidationConfig,
    snapshotRefreshOptions,
} from '../../generated/adapters/adapter-utils';
import { GetLayoutConfig, validateAdapterConfig } from '../../generated/adapters/getLayout';
import getUiApiLayoutByObjectApiName from '../../generated/resources/getUiApiLayoutByObjectApiName';
import {
    keyBuilder as recordLayoutRepresentationKeyBuilder,
    RecordLayoutRepresentation,
    select as recordLayoutRepresentationSelect,
} from '../../generated/types/RecordLayoutRepresentation';
import { MASTER_RECORD_TYPE_ID } from '../../util/layout';

const layoutSelections = recordLayoutRepresentationSelect();

type GetLayoutConfigWithDefaults = Omit<Required<GetLayoutConfig>, 'formFactor'>;

// FYI stricter required set than RAML, matches lds222 behavior
const getLayout_ConfigPropertyNames: AdapterValidationConfig = {
    displayName: 'getLayout',
    parameters: {
        required: ['objectApiName', 'layoutType', 'mode'],
        optional: ['recordTypeId'],
    },
};

function buildSnapshotRefresh(
    lds: LDS,
    config: GetLayoutConfigWithDefaults
): SnapshotRefresh<RecordLayoutRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(lds, config, snapshotRefreshOptions),
    };
}

export function buildNetworkSnapshot(
    lds: LDS,
    config: GetLayoutConfigWithDefaults,
    requestOverride?: ResourceRequestOverride
): Promise<Snapshot<RecordLayoutRepresentation>> {
    const recordTypeId = config.recordTypeId;
    const request = getUiApiLayoutByObjectApiName({
        urlParams: {
            objectApiName: config.objectApiName,
        },
        queryParams: {
            layoutType: config.layoutType,
            mode: config.mode,
            recordTypeId,
        },
    });

    const key = recordLayoutRepresentationKeyBuilder({
        objectApiName: config.objectApiName,
        recordTypeId,
        layoutType: config.layoutType,
        mode: config.mode,
    });

    return lds.dispatchResourceRequest<RecordLayoutRepresentation>(request, requestOverride).then(
        response => {
            const { body } = response;

            lds.storeIngest<RecordLayoutRepresentation>(key, request, body);
            lds.storeBroadcast();
            return lds.storeLookup<RecordLayoutRepresentation>(
                {
                    recordId: key,
                    node: layoutSelections,
                    variables: {},
                },
                buildSnapshotRefresh(lds, config)
            );
        },
        (error: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(key, error);
            lds.storeBroadcast();
            return lds.errorSnapshot(error, buildSnapshotRefresh(lds, config));
        }
    );
}

export function buildInMemorySnapshot(lds: LDS, config: GetLayoutConfigWithDefaults) {
    const { recordTypeId, layoutType, mode } = config;
    const key = recordLayoutRepresentationKeyBuilder({
        objectApiName: config.objectApiName,
        recordTypeId,
        layoutType,
        mode,
    });

    return lds.storeLookup<RecordLayoutRepresentation>(
        {
            recordId: key,
            node: layoutSelections,
            variables: {},
        },
        buildSnapshotRefresh(lds, config)
    );
}

function coerceConfigWithDefaults(untrusted: unknown): GetLayoutConfigWithDefaults | null {
    const config = validateAdapterConfig(untrusted, getLayout_ConfigPropertyNames);
    if (config === null) {
        return null;
    }

    // recordTypeId coercion is nuts: if `null` (but not undefined) then use MASTER record type id
    let recordTypeId = config.recordTypeId;
    if (recordTypeId === undefined) {
        // must check untrusted bc config has been coerced
        if ((untrusted as GetLayoutConfig).recordTypeId !== null) {
            return null;
        }
        recordTypeId = MASTER_RECORD_TYPE_ID;
    }

    // layoutType and mode are required during validation.
    // They will always be valid at this point.
    return {
        ...config,
        recordTypeId,
        layoutType: config.layoutType!,
        mode: config.mode!,
    };
}

export const factory: AdapterFactory<GetLayoutConfig, RecordLayoutRepresentation> = (lds: LDS) =>
    function getLayout(untrusted: unknown) {
        const config = coerceConfigWithDefaults(untrusted);
        if (config === null) {
            return null;
        }

        const snapshot = buildInMemorySnapshot(lds, config);

        // Cache hit
        if (lds.snapshotDataAvailable(snapshot)) {
            return snapshot;
        }

        return buildNetworkSnapshot(lds, config);
    };
