import {
    ArrayIsArray,
    ArrayPrototypePush,
    UncoercedConfiguration,
    Untrusted,
    untrustedIsObject,
} from '../../../generated/adapters/adapter-utils';
import { default as primitives_FieldIdArray_coerce_default } from '../../../primitives/FieldIdArray/coerce';
import { default as primitives_RecordId18_coerce_default } from '../../../primitives/RecordId18/coerce';
import { ObjectAssign } from '../../../util/language';
import { dedupe } from '../../../validation/utils';
import { GetRecordsEntityConfiguration, GetRecordsConfig } from './GetRecordsConfig';

export function coerceRecordId18Array(value: unknown): Array<string> | undefined {
    const valueArray = ArrayIsArray(value) ? value : [value];
    const ret: string[] = [];
    for (let i = 0, len = valueArray.length; i < len; i += 1) {
        const item: unknown = valueArray[i];
        const coerced = primitives_RecordId18_coerce_default(item);
        if (coerced === undefined) {
            return undefined;
        }
        ArrayPrototypePush.call(ret, coerced);
    }
    if (ret.length === 0) {
        return undefined;
    }
    return dedupe(ret);
}

export function coerceConfig(
    config: UncoercedConfiguration<GetRecordsConfig, any>
): Untrusted<GetRecordsConfig> {
    const coercedRecordsConfig = { records: [] } as Untrusted<GetRecordsConfig>;
    const { records: recordsFromConfig = [] } = config;
    for (let index = 0, len = recordsFromConfig.length; index < len; index += 1) {
        const coeredRecordConfig = {} as Untrusted<GetRecordsEntityConfiguration>;
        const currentRecordBatch: unknown = recordsFromConfig[index];
        if (untrustedIsObject<GetRecordsEntityConfiguration>(currentRecordBatch)) {
            const recordIds = coerceRecordId18Array(currentRecordBatch.recordIds);
            if (recordIds !== undefined) {
                coeredRecordConfig.recordIds = recordIds;
            }
            const optionalFields = primitives_FieldIdArray_coerce_default(
                currentRecordBatch.optionalFields
            );
            if (optionalFields !== undefined) {
                coeredRecordConfig.optionalFields = optionalFields;
            }
            const fields = primitives_FieldIdArray_coerce_default(currentRecordBatch.fields);
            if (fields !== undefined) {
                coeredRecordConfig.fields = fields;
            }
            ArrayPrototypePush.call(coercedRecordsConfig.records, coeredRecordConfig);
        }
    }
    return coercedRecordsConfig;
}

export function typeCheckConfig(
    untrustedConfig: Untrusted<GetRecordsConfig>
): Untrusted<GetRecordsConfig> {
    const coercedConfig = coerceConfig(untrustedConfig);

    const config = {} as Untrusted<GetRecordsConfig>;
    const untrustedConfigs_records = coercedConfig.records;
    if (ArrayIsArray(untrustedConfigs_records)) {
        const records = [] as Untrusted<GetRecordsEntityConfiguration>[];
        for (let index = 0, len = untrustedConfigs_records.length; index < len; index += 1) {
            const output_recordEntityConfig: Untrusted<GetRecordsEntityConfiguration> = {};
            const untrustedConfig_recordEntity = untrustedConfigs_records[index];
            if (untrustedIsObject<GetRecordsEntityConfiguration>(untrustedConfig_recordEntity)) {
                const {
                    recordIds: untrustedConfig_recordIds,
                    fields: untrustedConfig_fields,
                    optionalFields: untrustedConfig_optionalFields,
                } = untrustedConfig_recordEntity;
                if (ArrayIsArray(untrustedConfig_recordIds)) {
                    const untrustedConfig_recordIds_array: Array<string> = [];
                    for (
                        let i = 0, arrayLength = untrustedConfig_recordIds.length;
                        i < arrayLength;
                        i++
                    ) {
                        const untrustedConfig_recordIds_item = untrustedConfig_recordIds[i];
                        if (typeof untrustedConfig_recordIds_item === 'string') {
                            ArrayPrototypePush.call(
                                untrustedConfig_recordIds_array,
                                untrustedConfig_recordIds_item
                            );
                        }
                    }
                    output_recordEntityConfig.recordIds = untrustedConfig_recordIds_array;
                }
                if (
                    !output_recordEntityConfig.recordIds ||
                    output_recordEntityConfig.recordIds.length === 0
                ) {
                    continue;
                }
                if (ArrayIsArray(untrustedConfig_fields)) {
                    const untrustedConfig_fields_array: Array<string> = [];
                    for (
                        let i = 0, arrayLength = untrustedConfig_fields.length;
                        i < arrayLength;
                        i++
                    ) {
                        const untrustedConfig_fields_item = untrustedConfig_fields[i];
                        if (typeof untrustedConfig_fields_item === 'string') {
                            ArrayPrototypePush.call(
                                untrustedConfig_fields_array,
                                untrustedConfig_fields_item
                            );
                        }
                    }
                    output_recordEntityConfig.fields = untrustedConfig_fields_array;
                }
                if (ArrayIsArray(untrustedConfig_optionalFields)) {
                    const untrustedConfig_optionalFields_array: Array<string> = [];
                    for (
                        let i = 0, arrayLength = untrustedConfig_optionalFields.length;
                        i < arrayLength;
                        i++
                    ) {
                        const untrustedConfig_optionalFields_item =
                            untrustedConfig_optionalFields[i];
                        if (typeof untrustedConfig_optionalFields_item === 'string') {
                            ArrayPrototypePush.call(
                                untrustedConfig_optionalFields_array,
                                untrustedConfig_optionalFields_item
                            );
                        }
                    }
                    output_recordEntityConfig.optionalFields = untrustedConfig_optionalFields_array;
                }
                if (
                    output_recordEntityConfig.fields === undefined &&
                    output_recordEntityConfig.optionalFields === undefined
                ) {
                    continue;
                }
                ArrayPrototypePush.call(records, output_recordEntityConfig);
            }
        }
        if (records.length > 0) {
            ObjectAssign(config, { records });
        }
    }

    return config;
}
