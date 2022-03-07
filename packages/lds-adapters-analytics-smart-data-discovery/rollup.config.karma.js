import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-analytics-smart-data-discovery' }),
    ...adapterTestUtilConfigs({ testUtilName: 'analytics-smart-data-discovery-test-util' }),
];
