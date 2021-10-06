import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-videovisits' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-videovisits-test-util' }),
];
