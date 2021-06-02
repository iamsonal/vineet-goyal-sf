import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-platform-flow' }),
    ...adapterTestUtilConfigs({ testUtilName: 'platform-flow-test-util' }),
];
