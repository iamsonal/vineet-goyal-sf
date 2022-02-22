import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-marketing-assetcreation' }),
    ...adapterTestUtilConfigs({ testUtilName: 'marketing-assetcreation-test-util' }),
];
