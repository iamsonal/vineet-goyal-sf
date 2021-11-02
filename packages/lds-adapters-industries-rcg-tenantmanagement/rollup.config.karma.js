import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-rcg-tenantmanagement' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-rcg-tenantmanagement-test-util' }),
];
