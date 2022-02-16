import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-sustainability-dgf' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-sustainability-dgf-test-util' }),
];
