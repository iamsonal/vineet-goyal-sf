import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-commerce-store-pricing' }),
    ...adapterTestUtilConfigs({ testUtilName: 'commerce-store-pricing-test-util' }),
];
