import type {
    AdapterFactory,
    AdapterRequestContext,
    FetchResponse,
    Luvio,
    Snapshot,
} from '@luvio/engine';
import type { AdapterValidationConfig } from '../../generated/adapters/adapter-utils';
import { ObjectKeys } from '../../generated/adapters/adapter-utils';
import type { GetRecordConfig } from '../../generated/adapters/getRecord';
import { validateAdapterConfig } from '../../generated/adapters/getRecord';
import { createResourceRequest as getUiApiRecordsByRecordId } from '../../raml-artifacts/resources/getUiApiRecordsByRecordId/createResourceRequest';
import type {
    KeyParams,
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../../generated/types/RecordRepresentation';
import { keyBuilder, getTypeCacheKeys } from '../../generated/types/RecordRepresentation';
import coerceRecordId18 from '../../primitives/RecordId18/coerce';
import {
    getTrackedFields,
    convertFieldsToTrie,
    RECORD_REPRESENTATION_ERROR_STORE_METADATA_PARAMS,
} from '../../util/records';
import { getRecordByFields } from './GetRecordFields';
import type { GetRecordLayoutTypeConfig } from './GetRecordLayoutType';
import { getRecordLayoutType } from './GetRecordLayoutType';
import { createFieldsIngestSuccess as getRecordsResourceIngest } from '../../generated/fields/resources/getUiApiRecordsByRecordId';
import { configuration } from '../../configuration';
import { instrumentation } from '../../instrumentation';
import type { FieldMapRepresentation, FieldMapRepresentationNormalized } from '../../util/fields';

// Custom adapter config due to `unsupported` items
const GET_RECORD_ADAPTER_CONFIG: AdapterValidationConfig = {
    displayName: 'getRecord',
    parameters: {
        required: ['recordId'],
        optional: ['fields', 'layoutTypes', 'modes', 'optionalFields'],
        unsupported: [
            'childRelationships', // W-4421501
            'pageSize', // W-4045854
            'updateMru',
        ],
    },
};

function hasLayoutTypes(config: GetRecordConfig): config is GetRecordLayoutTypeConfig {
    return 'layoutTypes' in config;
}

function hasFieldsOrOptionalFields(config: GetRecordConfig): boolean {
    return 'fields' in config || 'optionalFields' in config;
}

function createResourceRequestFromRepresentation(
    representation: RecordRepresentation,
    optionalFields: string[]
) {
    const config = {
        urlParams: {
            recordId: representation.id,
        },
        queryParams: {
            optionalFields,
        },
    };
    return getUiApiRecordsByRecordId(config);
}

// eslint-disable-next-line @salesforce/lds/no-invalid-todo
// TODO: this should probably be code generated in RecordRepresentation
function coerceKeyParams(config: KeyParams): KeyParams {
    const coercedConfig = {} as KeyParams;

    const recordId = coerceRecordId18(config.recordId);
    if (recordId !== undefined) {
        coercedConfig.recordId = recordId;
    }

    return coercedConfig;
}

export const notifyChangeFactory = (luvio: Luvio) => {
    return function getUiApiRecordsByRecordIdNotifyChange(configs: KeyParams[]): void {
        const keys = configs.map((c) => keyBuilder(coerceKeyParams(c)));
        luvio.getNotifyChangeStoreEntries<RecordRepresentation>(keys).then((entries) => {
            const entryKeys = ObjectKeys(entries);
            for (let i = 0, len = entryKeys.length; i < len; i++) {
                const key = entryKeys[i];
                const val = entries[key];

                const node = luvio.wrapNormalizedGraphNode<
                    FieldMapRepresentationNormalized,
                    FieldMapRepresentation
                >(val as RecordRepresentationNormalized);
                const optionalFields = getTrackedFields(key, node, {
                    maxDepth: configuration.getTrackedFieldDepthOnNotifyChange(),
                    onlyFetchLeafNodeId: configuration.getTrackedFieldLeafNodeIdOnly(),
                });
                const refreshRequest = createResourceRequestFromRepresentation(val, optionalFields);
                const existingWeakEtag = val.weakEtag;

                const fieldTrie = convertFieldsToTrie([], false);
                const optionalFieldTrie = convertFieldsToTrie(optionalFields, true);

                return luvio.dispatchResourceRequest<RecordRepresentation>(refreshRequest).then(
                    (response) => {
                        return luvio.handleSuccessResponse(
                            () => {
                                const { body } = response;
                                luvio.storeIngest<RecordRepresentation>(
                                    key,
                                    getRecordsResourceIngest({
                                        fields: fieldTrie,
                                        optionalFields: optionalFieldTrie,
                                        trackedFields: optionalFieldTrie,
                                        serverRequestCount: 1,
                                    }),
                                    body
                                );
                                luvio.storeBroadcast();
                                instrumentation.getRecordNotifyChangeNetworkResult(
                                    existingWeakEtag !== (body as RecordRepresentation).weakEtag
                                );
                                return undefined;
                            },
                            () => getTypeCacheKeys(response.body, () => key)
                        );
                    },
                    (error: FetchResponse<unknown>) => {
                        return luvio.handleErrorResponse(() => {
                            const errorSnapshot = luvio.errorSnapshot(error);
                            luvio.storeIngestError(
                                key,
                                errorSnapshot,
                                RECORD_REPRESENTATION_ERROR_STORE_METADATA_PARAMS
                            );
                            luvio.storeBroadcast();
                            instrumentation.getRecordNotifyChangeNetworkResult(null, true);
                            return errorSnapshot;
                        });
                    }
                );
            }
        });
    };
};

export const factory: AdapterFactory<GetRecordConfig, RecordRepresentation> = (luvio: Luvio) =>
    function getRecord(
        untrustedConfig: unknown,
        requestContext?: AdapterRequestContext
    ): Promise<Snapshot<RecordRepresentation>> | Snapshot<RecordRepresentation> | null {
        // standard config validation and coercion
        const config = validateAdapterConfig(untrustedConfig, GET_RECORD_ADAPTER_CONFIG);
        if (config === null) {
            return null;
        }

        if (hasLayoutTypes(config)) {
            return getRecordLayoutType(luvio, config, requestContext);
        } else if (hasFieldsOrOptionalFields(config)) {
            return getRecordByFields(luvio, config, requestContext);
        }

        return null;
    };
