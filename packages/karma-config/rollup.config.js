import path from 'path';
import babel from 'rollup-plugin-babel';

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

function getEntryPath(filename) {
    return path.join(__dirname, 'utils', filename);
}

function getTargetPath(filename, compat) {
    let targetDir = path.join(__dirname, 'utils', 'dist');
    targetDir = compat ? path.join(targetDir, 'compat') : targetDir;
    return path.join(targetDir, filename);
}

function testUtilConfig(config) {
    const { compat } = config;
    return {
        input: getEntryPath('test-util.js'),
        plugins: [!!compat && compatBabelPlugin],
        output: {
            file: getTargetPath('test-util.js', compat),
            format: 'umd',
            name: 'testUtil',
            globals: {
                lwc: 'LWC',
                timekeeper: 'timekeeper',
                lds: 'lds',
            },
        },
        external: ['lwc', 'timekeeper', 'lds'],
    };
}

function globalSetupConfig(config) {
    const { compat } = config;
    return {
        input: getEntryPath('global-setup.js'),
        plugins: [!!compat && compatBabelPlugin],
        output: {
            file: getTargetPath('global-setup.js', compat),
            format: 'iife',
            globals: {
                'test-util': 'testUtil',
            },
        },
        external: ['test-util'],
    };
}

function getLwcLds(config) {
    const { compat } = config;
    return {
        input: require.resolve('@ldsjs/lwc-lds/dist/es/es2018/lwclds.js'),
        plugins: [!!compat && compatBabelPlugin],
        output: {
            file: getTargetPath('lwclds.js', compat),
            format: 'umd',
            name: 'lwcLds',
            globals: {
                lwc: 'LWC',
                '@ldsjs/engine': 'ldsEngine',
            },
        },
        external: ['lwc', '@ldsjs/engine'],
    };
}

module.exports = [
    getLwcLds({ compat: false }),
    getLwcLds({ compat: true }),

    testUtilConfig({ compat: false }),
    testUtilConfig({ compat: true }),

    globalSetupConfig({ compat: false }),
    globalSetupConfig({ compat: true }),
];
