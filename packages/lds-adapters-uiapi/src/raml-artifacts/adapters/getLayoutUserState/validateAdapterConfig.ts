import { validateAdapterConfig as originalValidateAdapterConfig } from '../../../generated/adapters/getLayoutUserState';
import type { AdapterValidationConfig } from '../../../generated/adapters/adapter-utils';
import { LayoutMode } from '../../../primitives/LayoutMode';
import { LayoutType } from '../../../primitives/LayoutType';

import type { GetLayoutUserStateConfig } from './getLayoutUserStateConfig';

export function validateAdapterConfig(
    untrustedConfig: unknown,
    configPropertyNames: AdapterValidationConfig
): GetLayoutUserStateConfig | null {
    const config = originalValidateAdapterConfig(untrustedConfig, configPropertyNames);
    if (config === null) {
        return null;
    }

    // recordTypeId is overridden to be required
    const recordTypeId = config.recordTypeId!;

    const untrusted = untrustedConfig as GetLayoutUserStateConfig;
    let layoutType = config.layoutType;
    if (layoutType === undefined) {
        if (untrusted.layoutType === undefined) {
            layoutType = LayoutType.Full;
        } else {
            return null;
        }
    }

    let mode = config.mode;
    if (mode === undefined) {
        if (untrusted.mode === undefined) {
            mode = LayoutMode.View;
        } else {
            return null;
        }
    }

    return {
        ...config,
        recordTypeId,
        layoutType,
        mode,
    };
}
