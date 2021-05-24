import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-cms-authoring' }),
    ...adapterTestUtilConfigs({ testUtilName: 'cms-authoring-test-util' }),
];
