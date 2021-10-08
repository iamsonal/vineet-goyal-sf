import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-community-microbatching' }),
    ...adapterTestUtilConfigs({ testUtilName: 'community-microbatching-test-util' }),
];
