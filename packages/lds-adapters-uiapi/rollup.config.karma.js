import path from 'path';
import typescript from 'rollup-plugin-typescript2';

import {
    compatBabelPlugin,
    ldsAdaptersConfigs,
    adapterTestUtilConfigs,
    targetConfigs,
} from '../../scripts/rollup/rollup.config.karma';

const ADAPTER_MODULE_NAME = 'lds-adapters-uiapi';

function getTargetPath(filename, compat) {
    let targetDir = path.join(__dirname, 'karma', 'dist');
    targetDir = compat ? path.join(targetDir, 'compat') : targetDir;
    return path.join(targetDir, filename);
}

function uiApiConstantsConfig() {
    return {
        input: path.join(__dirname, 'karma', 'uiapi-constants.ts'),
        output: {
            file: getTargetPath('uiapi-constants.js', false),
            format: 'es',
        },
        plugins: [
            typescript({
                clean: true,
                tsconfigOverride: {
                    compilerOptions: {
                        declaration: false,
                        target: 'es2018',
                    },
                },
            }),
        ],
    };
}

function uiApiTestSetupConfig() {
    const entryFile = path.join(__dirname, 'karma', 'uiapi-test-setup.js');

    return targetConfigs.map(({ compat }) => {
        return {
            input: entryFile,
            output: {
                file: getTargetPath('uiapi-test-setup.js', compat),
                format: 'iife',
                globals: {
                    'test-util': 'testUtil',
                },
            },
            external: ['test-util'],
            plugins: compat && [compatBabelPlugin],
        };
    });
}

function instrumentationConfigs() {
    const entryFile = path.join(__dirname, 'karma', 'uiapi-mock-instrumentation.js');

    return targetConfigs.map(({ compat }) => {
        return {
            input: entryFile,
            output: {
                file: getTargetPath('uiapi-mock-instrumentation.js', compat),
                format: 'umd',
                name: 'ldsInstrumentation',
            },
            plugins: compat && [compatBabelPlugin],
        };
    });
}

module.exports = [
    // uiApiConstants needs to be built prior to uiApiTestUtil
    uiApiConstantsConfig(),
    ...uiApiTestSetupConfig(),
    ...ldsAdaptersConfigs({ adapterModuleName: ADAPTER_MODULE_NAME }),
    ...adapterTestUtilConfigs({ testUtilName: 'uiapi-test-util' }).map((config) => {
        const { output, external } = config;
        output.globals[ADAPTER_MODULE_NAME] = 'ldsAdaptersUiapi';
        external.push(ADAPTER_MODULE_NAME);
        return config;
    }),
    ...instrumentationConfigs(),
];
