import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-sustainability-bei' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-sustainability-bei-test-util' }),
];
