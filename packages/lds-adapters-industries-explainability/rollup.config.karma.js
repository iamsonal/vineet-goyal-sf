import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-explainability' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-explainability-test-util' }),
];
