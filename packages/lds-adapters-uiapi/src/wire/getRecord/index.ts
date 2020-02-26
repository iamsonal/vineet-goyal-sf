import { AdapterFactory, FetchResponse, GraphNode, LDS, Snapshot } from '@ldsjs/engine';
import { AdapterValidationConfig, refreshable } from '../../generated/adapters/adapter-utils';
import { GetRecordConfig, validateAdapterConfig } from '../../generated/adapters/getRecord';
import getUiApiRecordsByRecordId from '../../generated/resources/getUiApiRecordsByRecordId';
import {
    keyBuilder,
    KeyParams,
    RecordRepresentation,
    RecordRepresentationNormalized,
    TTL as RecordRepresentationTTL,
} from '../../generated/types/RecordRepresentation';
import { getTrackedFields, markMissingOptionalFields } from '../../util/records';
import {
    buildNetworkSnapshot as getRecordByFieldsNetwork,
    getRecordByFields,
} from './GetRecordFields';
import {
    getRecordLayoutType,
    GetRecordLayoutTypeConfig,
    refresh as refreshLayoutType,
} from './GetRecordLayoutType';

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

export const notifyChangeFactory = (lds: LDS) => {
    return function getUiApiRecordsByRecordIdNotifyChange(configs: KeyParams[]): void {
        for (let i = 0, len = configs.length; i < len; i++) {
            // build key from input
            const key = keyBuilder(configs[i]);
            // lookup GraphNode from store
            const node = lds.getNode<RecordRepresentation, RecordRepresentation>(key);
            if (node === null || node.type === 'Error') {
                continue;
            }
            // retrieve data (Representation) from GraphNode and use createResourceRequestFromRepresentation to build refresh resource request from Representation
            const representation = (node as GraphNode<RecordRepresentation>).retrieve();
            const optionalFields = getTrackedFields(lds, representation.id);
            const refreshRequest = createResourceRequestFromRepresentation(
                representation,
                optionalFields
            );
            // dispatch resource request, then ingest and broadcast
            lds.dispatchResourceRequest<RecordRepresentation>(refreshRequest).then(
                response => {
                    const { body } = response;
                    lds.storeIngest<RecordRepresentation>(refreshRequest.key, refreshRequest, body);
                    const recordNode = lds.getNode<
                        RecordRepresentationNormalized,
                        RecordRepresentation
                    >(refreshRequest.key)!;
                    markMissingOptionalFields(recordNode, optionalFields);
                    lds.storeBroadcast();
                },
                (error: FetchResponse<unknown>) => {
                    lds.storeIngestFetchResponse(
                        refreshRequest.key,
                        error,
                        RecordRepresentationTTL
                    );
                    lds.storeBroadcast();
                }
            );
        }
    };
};

export const factory: AdapterFactory<GetRecordConfig, RecordRepresentation> = (lds: LDS) => {
    return refreshable(
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
        },
        (untrustedConfig: unknown) => {
            const config = validateAdapterConfig(untrustedConfig, GET_RECORD_ADAPTER_CONFIG);
            if (config === null) {
                throw new Error('Refresh should not be called with partial configuration');
            }

            if (hasLayoutTypes(config)) {
                return refreshLayoutType(lds, config);
            } else if (hasFieldsOrOptionalFields(config)) {
                return getRecordByFieldsNetwork(lds, config);
            }

            throw new Error(
                'Refresh should be called with either record fields configuration or record by layout configuration'
            );
        }
    );
};
