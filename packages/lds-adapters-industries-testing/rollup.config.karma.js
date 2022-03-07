import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-testing' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-testing-test-util' }),
];
