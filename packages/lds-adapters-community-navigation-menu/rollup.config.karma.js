import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-community-navigation-menu' }),
    ...adapterTestUtilConfigs({ testUtilName: 'community-navigation-menu-test-util' }),
];
