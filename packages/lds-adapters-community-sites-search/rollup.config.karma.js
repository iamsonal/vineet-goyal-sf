import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-community-sites-search' }),
    ...adapterTestUtilConfigs({ testUtilName: 'community-sites-search-test-util' }),
];
