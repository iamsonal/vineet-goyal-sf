import type { ResourceRequestConfig } from '../../../generated/resources/getUiApiRecordsBatchByRecordIds';
import { ArrayPrototypePush } from '../../../generated/adapters/adapter-utils';
import type { GetRecordsConfig } from './GetRecordsConfig';

export function createResourceParams(config: GetRecordsConfig): ResourceRequestConfig {
    const { records: configRecords } = config;
    const recordIds: string[] = [];
    const resourceConfigFields: string[] = [];
    const resourceConfigOptionalFields: string[] = [];
    for (let index = 0, len = configRecords.length; index < len; index += 1) {
        const {
            recordIds: recordIdsFromConfig,
            fields = [],
            optionalFields = [],
        } = configRecords[index];
        ArrayPrototypePush.call(recordIds, ...recordIdsFromConfig);
        if (fields.length > 0) {
            ArrayPrototypePush.call(resourceConfigFields, ...fields);
        }
        if (optionalFields.length > 0) {
            ArrayPrototypePush.call(resourceConfigOptionalFields, ...optionalFields);
        }
    }

    return {
        urlParams: {
            recordIds,
        },
        queryParams: {
            fields: resourceConfigFields.length > 0 ? resourceConfigFields : undefined,
            optionalFields:
                resourceConfigOptionalFields.length > 0 ? resourceConfigOptionalFields : undefined,
        },
    };
}
