import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-commerce-search' }),
    ...adapterTestUtilConfigs({ testUtilName: 'commerce-search-test-util' }),
];
