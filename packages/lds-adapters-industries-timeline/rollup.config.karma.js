import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-industries-timeline' }),
    ...adapterTestUtilConfigs({ testUtilName: 'industries-timeline-test-util' }),
];
