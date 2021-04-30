import path from 'path';
import babel from 'rollup-plugin-babel';
import camelCase from 'camelcase';

export const compatBabelPlugin = babel({
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    ie: '11',
                    chrome: '59',
                    firefox: '54',
                },
            },
        ],
    ],
});

export const targetConfigs = [{ compat: false }, { compat: true }];

function getTargetPath(filename, compat) {
    let targetDir = path.join(__dirname, 'karma', 'dist');
    targetDir = compat ? path.join(targetDir, 'compat') : targetDir;
    return path.join(targetDir, filename);
}

export function adapterTestUtilConfigs({ testUtilName }) {
    const filename = `${testUtilName}.js`;

    const entryFile = path.join(__dirname, 'karma', filename);

    return targetConfigs.map(({ compat }) => {
        return {
            input: entryFile,
            output: {
                file: getTargetPath(filename, compat),
                format: 'umd',
                name: camelCase(testUtilName),
                globals: {
                    timekeeper: 'timekeeper',
                    'lds-engine': 'ldsEngine',
                    sinon: 'sinon',
                    'test-util': 'testUtil',
                },
            },
            external: ['timekeeper', 'lds-engine', 'sinon', 'test-util'],
            plugins: compat && [compatBabelPlugin],
        };
    });
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
                globals: {
                    'force/ldsBindings': 'ldsBindings',
                    'force/ldsEngine': 'ldsEngine',
                    'force/ldsInstrumentation': 'ldsInstrumentation',
                },
            },
            external: ['force/ldsBindings', 'force/ldsEngine', 'force/ldsInstrumentation'],
            plugins: compat && [compatBabelPlugin],
        };
    });
}
