import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-identityverification' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-identityverification-test-util' }),
];
