import type {
    AdapterFactory,
    AdapterRequestContext,
    FetchResponse,
    GraphNode,
    Luvio,
    Snapshot,
} from '@luvio/engine';
import type { AdapterValidationConfig } from '../../generated/adapters/adapter-utils';
import type { GetRecordConfig } from '../../generated/adapters/getRecord';
import { validateAdapterConfig } from '../../generated/adapters/getRecord';
import { createResourceRequest as getUiApiRecordsByRecordId } from '../../raml-artifacts/resources/getUiApiRecordsByRecordId/createResourceRequest';
import type { KeyParams, RecordRepresentation } from '../../generated/types/RecordRepresentation';
import { keyBuilder } from '../../generated/types/RecordRepresentation';
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
        for (let i = 0, len = configs.length; i < len; i++) {
            // build key from input
            const coercedConfig = coerceKeyParams(configs[i]);
            const key = keyBuilder(coercedConfig);
            // lookup GraphNode from store
            const node = luvio.getNode<RecordRepresentation, RecordRepresentation>(key);
            if (node === null || node.type === 'Error') {
                continue;
            }
            // retrieve data (Representation) from GraphNode and use createResourceRequestFromRepresentation to build refresh resource request from Representation
            const representation: RecordRepresentation = (
                node as GraphNode<RecordRepresentation>
            ).retrieve();

            const optionalFields = getTrackedFields(key, luvio.getNode(key), {
                maxDepth: configuration.getTrackedFieldDepthOnNotifyChange(),
                onlyFetchLeafNodeId: configuration.getTrackedFieldLeafNodeIdOnly(),
            });
            const refreshRequest = createResourceRequestFromRepresentation(
                representation,
                optionalFields
            );
            const existingWeakEtag = representation.weakEtag;

            const fieldTrie = convertFieldsToTrie([], false);
            const optionalFieldTrie = convertFieldsToTrie(optionalFields, true);

            // dispatch resource request, then ingest and broadcast
            luvio.dispatchResourceRequest<RecordRepresentation>(refreshRequest).then(
                (response) => {
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
                },
                (error: FetchResponse<unknown>) => {
                    const errorSnapshot = luvio.errorSnapshot(error);
                    luvio.storeIngestError(
                        key,
                        errorSnapshot,
                        RECORD_REPRESENTATION_ERROR_STORE_METADATA_PARAMS
                    );
                    luvio.storeBroadcast();
                    instrumentation.getRecordNotifyChangeNetworkResult(null, true);
                }
            );
        }
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
