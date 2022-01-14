import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-healthcloud-hpi' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-healthcloud-hpi-test-util' }),
];
