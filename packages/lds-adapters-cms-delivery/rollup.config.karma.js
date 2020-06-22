import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-cms-delivery' }),
    ...adapterTestUtilConfigs({ testUtilName: 'cms-delivery-test-util' }),
];
