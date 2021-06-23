import {
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-experience-marketing-integration' }),
    ...adapterTestUtilConfigs({ testUtilName: 'experience-marketing-integration-test-util' }),
];
