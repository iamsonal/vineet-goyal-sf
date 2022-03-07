import type { AdapterValidationConfig } from '../../../generated/adapters/adapter-utils';
import type { GetLayoutConfig } from '../../../generated/adapters/getLayout';
import type { Luvio } from '@luvio/engine';
export type GetLayoutConfigWithDefaults = Omit<Required<GetLayoutConfig>, 'formFactor'>;

export type BuildSnapshotContext = {
    luvio: Luvio;
    config: GetLayoutConfigWithDefaults;
};

// FYI stricter required set than RAML, matches lds222 behavior
export const getLayout_ConfigPropertyNames: AdapterValidationConfig = {
    displayName: 'getLayout',
    parameters: {
        required: ['objectApiName', 'layoutType', 'mode'],
        optional: ['recordTypeId'],
    },
};
