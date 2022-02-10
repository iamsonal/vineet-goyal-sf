import type { GetLayoutConfig } from '../../../generated/adapters/getLayout';
import { validateAdapterConfig as baseValidateAdapterConfig } from '../../../generated/adapters/getLayout';
import { MASTER_RECORD_TYPE_ID } from '../../../util/layout';
import type { AdapterValidationConfig } from '../../../generated/adapters/adapter-utils';
import type { GetLayoutConfigWithDefaults } from './utils';
import { getLayout_ConfigPropertyNames } from './utils';

export function validateAdapterConfig(
    untrustedConfig: unknown,
    _configPropertyNames: AdapterValidationConfig
): GetLayoutConfigWithDefaults | null {
    const config = baseValidateAdapterConfig(untrustedConfig, getLayout_ConfigPropertyNames);

    if (config === null) {
        return null;
    }

    // recordTypeId coercion is nuts: if `null` (but not undefined) then use MASTER record type id
    let recordTypeId = config.recordTypeId;
    if (recordTypeId === undefined) {
        // must check untrusted bc config has been coerced
        if ((untrustedConfig as GetLayoutConfig).recordTypeId !== null) {
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
