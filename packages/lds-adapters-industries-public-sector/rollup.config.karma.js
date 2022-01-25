import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-public-sector' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-public-sector-test-util' }),
];
