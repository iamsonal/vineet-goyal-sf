import {
    AdapterFactory,
    LDS,
    Snapshot,
    ResourceRequestOverride,
    FetchResponse,
} from '@ldsjs/engine';
import { AdapterValidationConfig, refreshable } from '../../generated/adapters/adapter-utils';
import { GetLayoutConfig, validateAdapterConfig } from '../../generated/adapters/getLayout';
import getUiApiLayoutByObjectApiName from '../../generated/resources/getUiApiLayoutByObjectApiName';
import {
    keyBuilder as recordLayoutRepresentationKeyBuilder,
    RecordLayoutRepresentation,
    select as recordLayoutRepresentationSelect,
} from '../../generated/types/RecordLayoutRepresentation';
import { isFulfilledSnapshot } from '../../util/snapshot';
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

function requestLayout(
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
        apiName: config.objectApiName,
        recordTypeId,
        layoutType: config.layoutType,
        mode: config.mode,
    });

    return lds.dispatchResourceRequest<RecordLayoutRepresentation>(request, requestOverride).then(
        response => {
            const { body } = response;

            // TODO W-6399239 - fix API so we don't have to augment the response with request details in order
            // to support refresh. these are never emitted out per (private).
            body.apiName = config.objectApiName;
            body.recordTypeId = recordTypeId;

            lds.storeIngest<RecordLayoutRepresentation>(key, request, body);
            lds.storeBroadcast();
            return lds.storeLookup<RecordLayoutRepresentation>({
                recordId: key,
                node: layoutSelections,
                variables: {},
            });
        },
        (error: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(key, error);
            lds.storeBroadcast();
            return lds.errorSnapshot(error);
        }
    );
}

function cache(lds: LDS, config: GetLayoutConfigWithDefaults) {
    const { recordTypeId, layoutType, mode } = config;
    const key = recordLayoutRepresentationKeyBuilder({
        apiName: config.objectApiName,
        recordTypeId,
        layoutType,
        mode,
    });

    return lds.storeLookup<RecordLayoutRepresentation>({
        recordId: key,
        node: layoutSelections,
        variables: {},
    });
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

export const factory: AdapterFactory<GetLayoutConfig, RecordLayoutRepresentation> = (lds: LDS) => {
    return refreshable(
        (untrusted: unknown) => {
            const config = coerceConfigWithDefaults(untrusted);
            if (config === null) {
                return null;
            }

            const snapshot = cache(lds, config);

            // Cache hit
            if (isFulfilledSnapshot(snapshot)) {
                return snapshot;
            }

            return requestLayout(lds, config);
        },
        (untrusted: unknown) => {
            const config = coerceConfigWithDefaults(untrusted);
            if (config === null) {
                throw new Error('Refresh should not be called with partial configuration');
            }

            return requestLayout(lds, config, {
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
        }
    );
};
