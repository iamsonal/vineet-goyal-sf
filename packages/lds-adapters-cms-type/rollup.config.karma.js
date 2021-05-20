import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-cms-type' }),
    ...adapterTestUtilConfigs({ testUtilName: 'cms-type-test-util' }),
];
