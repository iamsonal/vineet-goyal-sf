import { AdapterValidationConfig } from '../../../generated/adapters/adapter-utils';

export const getRecords_ConfigPropertyNames: AdapterValidationConfig = {
    displayName: 'getRecords',
    parameters: {
        required: ['records'],
        optional: [],
    },
};
