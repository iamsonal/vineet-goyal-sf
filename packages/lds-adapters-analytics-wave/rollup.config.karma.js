import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-analytics-wave' }),
    ...adapterTestUtilConfigs({ testUtilName: 'analytics-wave-test-util' }),
];
