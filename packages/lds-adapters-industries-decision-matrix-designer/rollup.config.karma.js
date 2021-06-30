import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({
        adapterModuleName: 'lds-adapters-industries-decision-matrix-designer',
    }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-decision-matrix-designer-test-util' }),
];
