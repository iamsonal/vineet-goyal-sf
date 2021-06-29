import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-platform-scale-center' }),
    ...adapterTestUtilConfigs({ testUtilName: 'platform-scale-center-test-util' }),
];
