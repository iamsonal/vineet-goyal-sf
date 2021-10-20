import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-analytics-data-service' }),
    ...adapterTestUtilConfigs({ testUtilName: 'analytics-data-service-test-util' }),
];
