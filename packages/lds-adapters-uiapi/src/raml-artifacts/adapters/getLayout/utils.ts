import { AdapterValidationConfig } from '../../../generated/adapters/adapter-utils';
import { GetLayoutConfig } from '../../../generated/adapters/getLayout';
import { Luvio } from '@luvio/engine';
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
