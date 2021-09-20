import {
    AdapterValidationConfig,
    areRequiredParametersPresent,
    untrustedIsObject,
    validateConfig,
} from '../../../generated/adapters/adapter-utils';
import { splitQualifiedFieldApiName } from '../../../primitives/FieldId';
import { GetRecordsConfig, GetRecordsEntityConfiguration } from './GetRecordsConfig';
import { typeCheckConfig } from './typeCheckConfig';

export function checkFieldsObjectApiName(fields: string[], apiName: string): boolean {
    return fields.every((field) => splitQualifiedFieldApiName(field)[0] === apiName);
}

export function getObjectApiName(
    fields: GetRecordsEntityConfiguration['fields'],
    optionalFields: GetRecordsEntityConfiguration['optionalFields']
): string {
    if (fields === undefined || fields.length === 0) {
        return splitQualifiedFieldApiName((optionalFields as string[])[0])[0];
    }
    return splitQualifiedFieldApiName(fields[0])[0];
}

export function validateFieldsObjectApiName(config: GetRecordsConfig): void {
    const configRecords = config.records;

    for (let index = 0, len = configRecords.length; index < len; index++) {
        const {
            fields: configRecordEntityFields,
            optionalFields: configRecordEntityOptionalFields,
        } = configRecords[index];
        const objectApiName = getObjectApiName(
            configRecordEntityFields,
            configRecordEntityOptionalFields
        );

        // check objectApiName of fields and optionalFields array
        if (
            (configRecordEntityFields !== undefined &&
                !checkFieldsObjectApiName(configRecordEntityFields, objectApiName)) ||
            (configRecordEntityOptionalFields !== undefined &&
                !checkFieldsObjectApiName(configRecordEntityOptionalFields, objectApiName))
        ) {
            throw new TypeError(
                `all specified fields and optional fields must be of same ObjectApiName as ${objectApiName}`
            );
        }
    }
}

export function validateAdapterConfig(
    untrustedConfig: unknown,
    configPropertyNames: AdapterValidationConfig
): GetRecordsConfig | null {
    if (!untrustedIsObject<GetRecordsConfig>(untrustedConfig)) {
        return null;
    }

    if (process.env.NODE_ENV !== 'production') {
        validateConfig<GetRecordsConfig>(untrustedConfig, configPropertyNames);
    }

    const config = typeCheckConfig(untrustedConfig);

    if (!areRequiredParametersPresent<GetRecordsConfig>(config, configPropertyNames)) {
        return null;
    }

    // If we have made it this far, our config is validated and type checked
    if (process.env.NODE_ENV !== 'production') {
        validateFieldsObjectApiName(config);
    }

    return config;
}
