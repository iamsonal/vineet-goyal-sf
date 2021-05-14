import {
    AdapterFactory,
    Luvio,
    Snapshot,
    ResourceRequestOverride,
    FetchResponse,
    SnapshotRefresh,
    ResourceResponse,
    UnfulfilledSnapshot,
} from '@luvio/engine';
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
    ingest as recordLayoutRepresentationIngest,
} from '../../generated/types/RecordLayoutRepresentation';
import { MASTER_RECORD_TYPE_ID } from '../../util/layout';
import { isUnfulfilledSnapshot } from '../../util/snapshot';

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
    luvio: Luvio,
    config: GetLayoutConfigWithDefaults
): SnapshotRefresh<RecordLayoutRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config, snapshotRefreshOptions),
    };
}

function buildRequestAndKey(config: GetLayoutConfigWithDefaults) {
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

    return { request, key };
}

function onResourceResponseSuccess(
    luvio: Luvio,
    config: GetLayoutConfigWithDefaults,
    key: string,
    response: ResourceResponse<RecordLayoutRepresentation>
) {
    const { body } = response;

    luvio.storeIngest<RecordLayoutRepresentation>(key, recordLayoutRepresentationIngest, body);
    luvio.storeBroadcast();
    return luvio.storeLookup<RecordLayoutRepresentation>(
        {
            recordId: key,
            node: layoutSelections,
            variables: {},
        },
        buildSnapshotRefresh(luvio, config)
    );
}

function onResourceResponseError(
    luvio: Luvio,
    config: GetLayoutConfigWithDefaults,
    key: string,
    error: FetchResponse<unknown>
) {
    const errorSnapshot = luvio.errorSnapshot(error, buildSnapshotRefresh(luvio, config));
    luvio.storeIngestError(key, errorSnapshot);
    luvio.storeBroadcast();
    return errorSnapshot;
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetLayoutConfigWithDefaults,
    requestOverride?: ResourceRequestOverride
): Promise<Snapshot<RecordLayoutRepresentation>> {
    const { request, key } = buildRequestAndKey(config);

    return luvio.dispatchResourceRequest<RecordLayoutRepresentation>(request, requestOverride).then(
        (response) => {
            return onResourceResponseSuccess(luvio, config, key, response);
        },
        (error: FetchResponse<unknown>) => {
            return onResourceResponseError(luvio, config, key, error);
        }
    );
}

export function resolveUnfulfilledSnapshot(
    luvio: Luvio,
    config: GetLayoutConfigWithDefaults,
    snapshot: UnfulfilledSnapshot<RecordLayoutRepresentation, unknown>
): Promise<Snapshot<RecordLayoutRepresentation>> {
    const { request, key } = buildRequestAndKey(config);

    return luvio.resolveUnfulfilledSnapshot<RecordLayoutRepresentation>(request, snapshot).then(
        (response) => {
            return onResourceResponseSuccess(luvio, config, key, response);
        },
        (error: FetchResponse<unknown>) => {
            return onResourceResponseError(luvio, config, key, error);
        }
    );
}

export function buildInMemorySnapshot(luvio: Luvio, config: GetLayoutConfigWithDefaults) {
    const { recordTypeId, layoutType, mode } = config;
    const key = recordLayoutRepresentationKeyBuilder({
        objectApiName: config.objectApiName,
        recordTypeId,
        layoutType,
        mode,
    });

    return luvio.storeLookup<RecordLayoutRepresentation>(
        {
            recordId: key,
            node: layoutSelections,
            variables: {},
        },
        buildSnapshotRefresh(luvio, config)
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

export const factory: AdapterFactory<GetLayoutConfig, RecordLayoutRepresentation> = (
    luvio: Luvio
) =>
    function getLayout(untrusted: unknown) {
        const config = coerceConfigWithDefaults(untrusted);
        if (config === null) {
            return null;
        }

        const snapshot = buildInMemorySnapshot(luvio, config);

        // Cache hit
        if (luvio.snapshotAvailable(snapshot)) {
            return snapshot;
        }

        if (isUnfulfilledSnapshot(snapshot)) {
            return resolveUnfulfilledSnapshot(luvio, config, snapshot);
        }

        return buildNetworkSnapshot(luvio, config);
    };
