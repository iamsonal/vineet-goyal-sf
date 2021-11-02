import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({
        adapterModuleName: 'lds-adapters-industries-sustainability-recalculate',
    }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-sustainability-recalculate-test-util' }),
];
