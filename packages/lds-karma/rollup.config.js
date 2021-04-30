import path from 'path';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';

const IMPL_TEST_UTILS_NAME = 'implTestUtils';

const compatBabelPlugin = babel({
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

const UTILS_ENTRY_DIR = path.join(__dirname, 'utils');

const DIST_DIR = path.join(__dirname, 'dist');
const COMPAT_DIST_DIR = path.join(DIST_DIR, 'compat');

function getTargetPath(filename, compat) {
    const targetDir = compat ? COMPAT_DIST_DIR : DIST_DIR;
    return path.join(targetDir, filename);
}

function ldsBindingsConfigs(configs) {
    const entryFile = path.join(__dirname, 'lds-bindings-karma.js');

    return configs.map(({ compat }) => {
        return {
            input: entryFile,
            output: {
                file: getTargetPath('lds-bindings.js', compat),
                format: 'umd',
                name: 'ldsBindings',
                globals: {
                    lwc: 'LWC',
                },
            },
            external: ['lwc'],
            plugins: [resolve(), ...(compat ? [compatBabelPlugin] : [])],
        };
    });
}

function commonTestUtilConfigs(configs) {
    const filename = path.join('utils', 'test-util.js');
    const entryFile = path.join(__dirname, filename);

    return configs.map(({ compat }) => {
        return {
            input: entryFile,
            output: {
                file: getTargetPath(filename, compat),
                format: 'umd',
                name: 'testUtil',
                globals: {
                    lwc: 'LWC',
                    timekeeper: 'timekeeper',
                    'lds-engine': 'ldsEngine',
                    'impl-test-utils': IMPL_TEST_UTILS_NAME,
                },
            },
            external: ['lwc', 'timekeeper', 'lds-engine', 'impl-test-utils'],
            plugins: compat && [compatBabelPlugin],
        };
    });
}

function globalSetupConfigs(configs) {
    const filename = path.join('utils', 'global-setup.js');
    const entryFile = path.join(__dirname, filename);

    return configs.map(({ compat }) => {
        return {
            input: entryFile,
            output: {
                file: getTargetPath(filename, compat),
                format: 'iife',
                globals: {
                    'test-util': 'testUtil',
                },
            },
            external: ['test-util'],
            plugins: compat ? [compatBabelPlugin] : [],
        };
    });
}

function implTestUtilsConfigs(configs) {
    return configs.map(({ entryFile, outputFile, compat }) => {
        return {
            input: entryFile,
            output: {
                file: outputFile,
                format: 'umd',
                name: IMPL_TEST_UTILS_NAME,
                globals: {
                    ldsEngine: 'ldsEngine',
                },
            },
            external: ['ldsEngine'],
            plugins: compat ? [compatBabelPlugin] : [],
        };
    });
}

function ldsEngineConfigs(configs) {
    return configs.map(({ entryFile, outputFile, compat }) => {
        return {
            input: entryFile,
            output: {
                file: outputFile,
                format: 'umd',
                name: 'ldsEngine',
                globals: {
                    sinon: 'sinon',
                },
            },
            external: ['sinon'],
            plugins: [resolve(), ...(compat ? [compatBabelPlugin] : [])],
        };
    });
}

const configs = [{ compat: false }, { compat: true }];
module.exports = [
    ...ldsBindingsConfigs(configs),
    ...globalSetupConfigs(configs),
    ...commonTestUtilConfigs(configs),

    ...ldsEngineConfigs([
        {
            entryFile: path.join(__dirname, 'lds-runtime-browser.js'),
            outputFile: path.join(DIST_DIR, 'lds-runtime-browser.js'),
            compat: false,
        },
        {
            entryFile: path.join(__dirname, 'lds-runtime-browser.js'),
            outputFile: path.join(COMPAT_DIST_DIR, 'lds-runtime-browser.js'),
            compat: true,
        },
    ]),

    ...implTestUtilsConfigs([
        {
            entryFile: path.join(UTILS_ENTRY_DIR, 'browser', 'browser-test-utils.js'),
            outputFile: path.join(DIST_DIR, 'utils', 'browser-test-utils.js'),
            compat: false,
        },
        {
            entryFile: path.join(UTILS_ENTRY_DIR, 'browser', 'browser-test-utils.js'),
            outputFile: path.join(COMPAT_DIST_DIR, 'utils', 'browser-test-utils.js'),
            compat: true,
        },
    ]),
];
