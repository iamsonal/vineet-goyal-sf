import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({
        adapterModuleName: 'lds-adapters-industries-sustainability-record-lockunlock',
    }),
    ...adapterTestUtilConfigs({
        testUtilName: 'industries-sustainability-record-lockunlock-test-util',
    }),
];
