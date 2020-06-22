import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-commerce-catalog' }),
    ...adapterTestUtilConfigs({ testUtilName: 'commerce-catalog-test-util' }),
];
