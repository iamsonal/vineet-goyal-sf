import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-einstein-aiaccelerator' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-einstein-aiaccelerator-test-util' }),
];
