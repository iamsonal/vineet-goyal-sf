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
                '@salesforce-lds/engine': 'ldsEngine',
                '@salesforce-lds/lwc-lds': 'lwcLds',
                '@salesforce-lds-api/apex': 'apexService',
            },
        },
        external: [
            'sinon',
            'lwc',
            'wire-service',
            '@salesforce-lds/engine',
            '@salesforce-lds/lwc-lds',
            '@salesforce-lds-api/apex',
        ],
    };
}

function apexTestUtilConfig(config) {
    const { compat } = config;
    return {
        input: path.join(__dirname, 'karma', 'apex-test-util.js'),
        output: {
            file: getTargetPath('apex-test-util.js', compat),
            format: 'umd',
            name: 'apexTestUtil',
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

module.exports = [
    ldsConfig({ compat: false }),
    ldsConfig({ compat: true }),
    apexTestUtilConfig({ compat: false }),
    apexTestUtilConfig({ compat: true }),
];
