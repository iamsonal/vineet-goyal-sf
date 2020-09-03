import { AdapterFactory, FetchResponse, GraphNode, LDS, Snapshot } from '@ldsjs/engine';
import { AdapterValidationConfig } from '../../generated/adapters/adapter-utils';
import { GetRecordConfig, validateAdapterConfig } from '../../generated/adapters/getRecord';
import getUiApiRecordsByRecordId from '../../generated/resources/getUiApiRecordsByRecordId';
import {
    keyBuilder,
    KeyParams,
    RecordRepresentation,
    RecordRepresentationNormalized,
    TTL as RecordRepresentationTTL,
    ingest as recordRepresentationIngest,
} from '../../generated/types/RecordRepresentation';
import coerceRecordId18 from '../../primitives/RecordId18/coerce';
import { getTrackedFields, markMissingOptionalFields } from '../../util/records';
import { getRecordByFields } from './GetRecordFields';
import { getRecordLayoutType, GetRecordLayoutTypeConfig } from './GetRecordLayoutType';

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

// TODO: this should probably be code generated in RecordRepresentation
function coerceKeyParams(config: KeyParams): KeyParams {
    const coercedConfig = {} as KeyParams;

    const recordId = coerceRecordId18(config.recordId);
    if (recordId !== undefined) {
        coercedConfig.recordId = recordId;
    }

    return coercedConfig;
}

const NOTIFY_CHANGE_NETWORK_KEY = 'notify-change-network';

const notifyChangeNetworkRejectInstrumentParamBuilder = () => {
    return {
        [NOTIFY_CHANGE_NETWORK_KEY]: 'error',
    };
};

export const notifyChangeFactory = (lds: LDS) => {
    return function getUiApiRecordsByRecordIdNotifyChange(configs: KeyParams[]): void {
        for (let i = 0, len = configs.length; i < len; i++) {
            // build key from input
            const coercedConfig = coerceKeyParams(configs[i]);
            const key = keyBuilder(coercedConfig);
            // lookup GraphNode from store
            const node = lds.getNode<RecordRepresentation, RecordRepresentation>(key);
            if (node === null || node.type === 'Error') {
                continue;
            }
            // retrieve data (Representation) from GraphNode and use createResourceRequestFromRepresentation to build refresh resource request from Representation
            const representation: RecordRepresentation = (node as GraphNode<
                RecordRepresentation
            >).retrieve();
            const optionalFields = getTrackedFields(lds, representation.id);
            const refreshRequest = createResourceRequestFromRepresentation(
                representation,
                optionalFields
            );
            const existingWeakEtag = representation.weakEtag;
            // dispatch resource request, then ingest and broadcast
            lds.dispatchResourceRequest<RecordRepresentation>(refreshRequest).then(
                response => {
                    const { body } = response;
                    lds.storeIngest<RecordRepresentation>(key, recordRepresentationIngest, body);
                    const recordNode = lds.getNode<
                        RecordRepresentationNormalized,
                        RecordRepresentation
                    >(key)!;
                    markMissingOptionalFields(recordNode, optionalFields);
                    lds.storeBroadcast();
                    const notifyChangeNetworkResolveInstrumentParamBuilder = () => {
                        return {
                            [NOTIFY_CHANGE_NETWORK_KEY]:
                                existingWeakEtag !== (body as RecordRepresentation).weakEtag,
                        };
                    };
                    lds.instrument(notifyChangeNetworkResolveInstrumentParamBuilder);
                },
                (error: FetchResponse<unknown>) => {
                    lds.storeIngestFetchResponse(key, error, RecordRepresentationTTL);
                    lds.storeBroadcast();
                    lds.instrument(notifyChangeNetworkRejectInstrumentParamBuilder);
                }
            );
        }
    };
};

export const factory: AdapterFactory<GetRecordConfig, RecordRepresentation> = (lds: LDS) =>
    function getRecord(
        untrustedConfig: unknown
    ): Promise<Snapshot<RecordRepresentation>> | Snapshot<RecordRepresentation> | null {
        // standard config validation and coercion
        const config = validateAdapterConfig(untrustedConfig, GET_RECORD_ADAPTER_CONFIG);
        if (config === null) {
            return null;
        }

        if (hasLayoutTypes(config)) {
            return getRecordLayoutType(lds, config);
        } else if (hasFieldsOrOptionalFields(config)) {
            return getRecordByFields(lds, config);
        }

        return null;
    };
