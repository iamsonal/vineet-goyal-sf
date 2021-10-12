import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-loyalty-engine' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-loyalty-engine-test-util' }),
];
