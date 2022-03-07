import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({
        adapterModuleName: 'lds-adapters-industries-sustainability-reference-data',
    }),
    ...adapterTestUtilConfigs({
        testUtilName: 'industries-sustainability-reference-data-test-util',
    }),
];
