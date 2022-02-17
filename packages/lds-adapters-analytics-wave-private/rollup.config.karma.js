import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-analytics-wave-private' }),
    ...adapterTestUtilConfigs({ testUtilName: 'analytics-wave-private-test-util' }),
];
