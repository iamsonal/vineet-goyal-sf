import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-platform-learning-content' }),
    ...adapterTestUtilConfigs({ testUtilName: 'platform-learning-content-test-util' }),
];
