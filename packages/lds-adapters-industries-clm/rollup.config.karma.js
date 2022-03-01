import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-clm' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-clm-test-util' }),
];
