import path from 'path';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';

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
            },
        },
        external: ['sinon', 'lwc', 'wire-service', '@ldsjs/engine', '@ldsjs/lwc-lds'],
    };
}

function commerceSearchTestUtilConfig(config) {
    const { compat } = config;
    return {
        input: path.join(__dirname, 'karma', 'commerce-search-test-util.js'),
        output: {
            file: getTargetPath('commerce-search-test-util.js', compat),
            format: 'umd',
            name: 'commerceSearchTestUtil',
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

function ldsNativeProxyConfig() {
    return {
        input: path.join(__dirname, 'karma', 'ldsNativeProxy.js'),
        plugins: [resolve()],
        output: {
            file: getTargetPath('ldsNativeProxy.js', false),
            format: 'umd',
            name: 'lds', // use same name as browser so it gets swapped in properly
            globals: {
                sinon: 'sinon',
                lwc: 'LWC',
                'wire-service': 'WireService',
                '@ldsjs/engine': 'ldsEngine',
                '@ldsjs/lwc-lds': 'lwcLds',
                '@salesforce/lds-adapters-commerce-search': 'commerceSearchService',
            },
        },
        external: [
            'sinon',
            'lwc',
            'wire-service',
            '@ldsjs/engine',
            '@ldsjs/lwc-lds',
            '@salesforce/lds-adapters-commerce-search',
        ],
    };
}

module.exports = [
    ldsConfig({ compat: false }),
    ldsConfig({ compat: true }),
    commerceSearchTestUtilConfig({ compat: false }),
    commerceSearchTestUtilConfig({ compat: true }),
    ldsNativeProxyConfig(),
];
