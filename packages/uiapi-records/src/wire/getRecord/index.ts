import { AdapterFactory, LDS, Snapshot } from '@ldsjs/engine';
import { AdapterValidationConfig, refreshable } from '../../generated/adapters/adapter-utils';
import { GetRecordConfig, validateAdapterConfig } from '../../generated/adapters/getRecord';
import { RecordRepresentation } from '../../generated/types/RecordRepresentation';
import {
    getRecordByFields,
    buildNetworkSnapshot as getRecordByFieldsNetwork,
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
