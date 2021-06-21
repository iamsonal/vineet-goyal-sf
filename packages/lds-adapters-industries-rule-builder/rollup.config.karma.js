import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-rule-builder' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-rule-builder-test-util' }),
];
