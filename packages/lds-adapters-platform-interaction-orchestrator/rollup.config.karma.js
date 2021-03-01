import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-platform-interaction-orchestrator' }),
    ...adapterTestUtilConfigs({ testUtilName: 'platform-interaction-orchestrator-test-util' }),
];
