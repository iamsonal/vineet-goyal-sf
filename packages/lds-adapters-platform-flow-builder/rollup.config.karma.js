import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-platform-flow-builder' }),
    ...adapterTestUtilConfigs({ testUtilName: 'platform-flow-builder-test-util' }),
];
