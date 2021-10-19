import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-cib' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-cib-test-util' }),
];
