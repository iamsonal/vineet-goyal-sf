import path from 'path';
import camelCase from 'camelcase';

import { adapterTestUtilConfigs, targetConfigs } from '../../scripts/rollup/rollup.config.karma';

function getTargetPath(filename, compat) {
    let targetDir = path.join(__dirname, 'karma', 'dist');
    targetDir = compat ? path.join(targetDir, 'compat') : targetDir;
    return path.join(targetDir, filename);
}

export function ldsAdaptersConfigs({ adapterModuleName }, overrides = {}) {
    const { entryFile: entryFileOverride } = overrides;
    const entryFile = entryFileOverride || path.join(__dirname, 'sfdc', 'index.js');

    return targetConfigs.map(({ compat }) => {
        return {
            input: entryFile,
            output: {
                file: getTargetPath(`${adapterModuleName}.js`, compat),
                format: 'umd',
                name: camelCase(adapterModuleName),
            },
        };
    });
}

module.exports = [
    ...ldsAdaptersConfigs(
        { adapterModuleName: 'lds-adapters-graphql' },
        { entryFile: path.join(__dirname, 'karma', 'lds-adapters-graphql.js') }
    ),
    ...adapterTestUtilConfigs({ testUtilName: 'graphql-test-util' }),
];
