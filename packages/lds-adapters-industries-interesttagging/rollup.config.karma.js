import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-interesttagging' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-interesttagging-test-util' }),
];
