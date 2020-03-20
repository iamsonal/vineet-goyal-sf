import path from 'path';
import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';

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

function getTargetPath(filename, compat) {
    let targetDir = path.join(__dirname, 'karma', 'dist');
    targetDir = compat ? path.join(targetDir, 'compat') : targetDir;
    return path.join(targetDir, filename);
}

function uiApiTestUtilConfig(config) {
    const { compat } = config;
    return {
        input: path.join(__dirname, 'karma', 'uiapi-test-util.js'),
        output: {
            file: getTargetPath('uiapi-test-util.js', compat),
            format: 'umd',
            name: 'uiApiTestUtil',
            globals: {
                timekeeper: 'timekeeper',
                lds: 'lds',
                sinon: 'sinon',
                'test-util': 'testUtil',
            },
        },
        plugins: [!!compat && compatBabelPlugin],
        external: ['timekeeper', 'lds', 'sinon', 'test-util'],
    };
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

function uiApiTestSetupConfig(config) {
    const { compat } = config;
    return {
        input: path.join(__dirname, 'karma', 'uiapi-test-setup.js'),
        plugins: [!!compat && compatBabelPlugin],
        output: {
            file: getTargetPath('uiapi-test-setup.js', compat),
            format: 'iife',
            globals: {
                'test-util': 'testUtil',
            },
        },
        external: ['test-util'],
    };
}

function ldsConfig(config) {
    const { compat } = config;
    return {
        input: path.join(__dirname, 'karma', 'lds.js'),
        plugins: [!!compat && compatBabelPlugin, resolve()],
        output: {
            file: getTargetPath('lds.js', compat),
            format: 'umd',
            name: 'lds',
            globals: {
                sinon: 'sinon',
                lwc: 'LWC',
                'wire-service': 'WireService',
                '@ldsjs/engine': 'ldsEngine',
                '@ldsjs/lwc-lds': 'lwcLds',
                '@salesforce/lds-adapters-uiapi': 'uiapiRecordsService',
            },
        },
        external: [
            'sinon',
            'lwc',
            'wire-service',
            '@ldsjs/engine',
            '@ldsjs/lwc-lds',
            '@salesforce/lds-adapters-uiapi',
        ],
    };
}

function ldsWebviewConfig() {
    return {
        input: path.join(__dirname, 'karma', 'lds.js'),
        plugins: [
            replace({
                values: {
                    '@salesforce/lds-karma-config/lds-setup':
                        '@salesforce/lds-karma-config/lds-webview-setup',
                },
                delimiters: ['', ''],
            }),
            resolve(),
        ],
        output: {
            file: getTargetPath('lds-webview.js', false),
            format: 'umd',
            name: 'lds', // use same name as browser so it gets swapped in properly
            globals: {
                sinon: 'sinon',
                lwc: 'LWC',
                'wire-service': 'WireService',
                '@ldsjs/engine': 'ldsEngine',
                '@ldsjs/lwc-lds': 'lwcLds',
                '@salesforce/lds-adapters-uiapi': 'uiapiRecordsService',
            },
        },
        external: [
            'sinon',
            'lwc',
            'wire-service',
            '@ldsjs/engine',
            '@ldsjs/lwc-lds',
            '@salesforce/lds-adapters-uiapi',
        ],
    };
}

module.exports = [
    // uiApiConstants needs to be built prior to uiApiTestUtil
    uiApiConstantsConfig(),
    uiApiTestUtilConfig({ compat: false }),
    uiApiTestUtilConfig({ compat: true }),
    uiApiTestSetupConfig({ compat: false }),
    uiApiTestSetupConfig({ compat: true }),
    ldsConfig({ compat: false }),
    ldsConfig({ compat: true }),
    ldsWebviewConfig(),
];
