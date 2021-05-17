import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';

import {
    adapterTestUtilConfigs,
    ldsAdaptersConfigs,
} from '../../scripts/rollup/rollup.config.karma';

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-graphql' }),
    ...adapterTestUtilConfigs({ testUtilName: 'graphql-test-util' }).map((config) => {
        const { plugins } = config;
        config.plugins = [
            ...(plugins || []),
            resolve(),
            replace({
                'process.env.NODE_ENV': JSON.stringify('test'),
            }),
        ];
        return config;
    }),
];
