import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-community-seo' }),
    ...adapterTestUtilConfigs({ testUtilName: 'community-seo-test-util' }),
];
