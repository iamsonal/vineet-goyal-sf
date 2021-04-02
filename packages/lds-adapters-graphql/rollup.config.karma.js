import path from 'path';
import camelCase from 'camelcase';

import {
    compatBabelPlugin,
    adapterTestUtilConfigs,
    targetConfigs,
} from '../../scripts/rollup/rollup.config.karma';

function getTargetPath(filename, compat) {
    let targetDir = path.join(__dirname, 'karma', 'dist');
    targetDir = compat ? path.join(targetDir, 'compat') : targetDir;
    return path.join(targetDir, filename);
}

export function ldsAdaptersConfigs({ adapterModuleName }) {
    const entryFile = path.join(__dirname, 'karma', 'lds-adapters-graphql.js');

    return targetConfigs.map(({ compat }) => {
        return {
            input: entryFile,
            output: {
                file: getTargetPath(`${adapterModuleName}.js`, compat),
                format: 'umd',
                name: camelCase(adapterModuleName),
                globals: {
                    'force/ldsBindings': 'ldsBindings',
                },
            },
            external: ['force/ldsBindings'],
            plugins: compat && [compatBabelPlugin],
        };
    });
}

module.exports = [
    ...ldsAdaptersConfigs({ adapterModuleName: 'lds-adapters-graphql' }),
    ...adapterTestUtilConfigs({ testUtilName: 'graphql-test-util' }),
];
