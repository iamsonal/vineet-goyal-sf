import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-revenue-billing-batch' }),
    ...adapterTestUtilConfigs({ testUtilName: 'revenue-billing-batch-test-util' }),
];
