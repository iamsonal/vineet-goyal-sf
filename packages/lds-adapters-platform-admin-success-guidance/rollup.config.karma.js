import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-platform-admin-success-guidance' }),
    ...adapterTestUtilConfigs({ testUtilName: 'platform-admin-success-guidance-test-util' }),
];
