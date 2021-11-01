module.exports = {
    projectName: 'lds-benchmark',
    benchmarkIterations: 30,
    plugins: [
        'rollup-plugin-node-resolve',
        '<rootDir>/best/rollup-plugin-mocks/index.js',
        ['rollup-plugin-replace', { 'process.env.NODE_ENV': JSON.stringify('production') }],
    ],
    specs: { name: 'chrome.headless', version: 80 },
    mainBranch: 'main',
    runners: [
        {
            alias: 'default',
            runner: '@best/runner-headless',
        },
        {
            runner: '@best/runner-remote',
            alias: 'remote',
            config: {
                uri: process.env.BEST_HUB_HOSTNAME,
                options: { authToken: process.env.BEST_HUB_CLIENT_TOKEN },
            },
        },
    ],
};
