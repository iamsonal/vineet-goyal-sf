import { ArrayIsArray } from '../../../generated/adapters/adapter-utils';
import { ResourceRequestConfig } from '../../../generated/resources/getUiApiRecordsByRecordId';
import { GetRecordsConfig } from './GetRecordsConfig';

export function createChildResourceParams(config: GetRecordsConfig) {
    const childResources: ResourceRequestConfig[] = [];
    const { records } = config;
    for (
        let outerIdx = 0, numOfRecordBatches = records.length;
        outerIdx < numOfRecordBatches;
        outerIdx += 1
    ) {
        const currentRecordBatch = records[outerIdx];
        const { recordIds, fields, optionalFields } = currentRecordBatch;
        for (
            let innerIdx = 0, numOfRecordIds = recordIds.length;
            innerIdx < numOfRecordIds;
            innerIdx += 1
        ) {
            const currentRecordId = recordIds[innerIdx];
            const queryParams: ResourceRequestConfig['queryParams'] = {};
            if (ArrayIsArray(fields)) {
                queryParams.fields = fields;
            }

            if (ArrayIsArray(optionalFields)) {
                queryParams.optionalFields = optionalFields;
            }

            childResources.push({
                urlParams: {
                    recordId: currentRecordId,
                },
                queryParams,
            });
        }
    }
    return childResources;
}
