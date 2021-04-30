import {
    adapterTestUtilConfigs,
    ldsAdaptersConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-graphql' }),
    ...adapterTestUtilConfigs({ testUtilName: 'graphql-test-util' }),
];
