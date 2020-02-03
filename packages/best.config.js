module.exports = {
    projectName: 'lds-benchmark',
    plugins: [
        'rollup-plugin-node-resolve',
        ['rollup-plugin-replace', { 'process.env.NODE_ENV': JSON.stringify('production') }],
    ],
    runners: [
        {
            alias: 'default',
            runner: '@best/runner-headless',
        },
        {
            alias: 'remote',
            runner: '@best/runner-hub',
            config: {
                host: process.env.BEST_HUB_HOSTNAME,
                options: {
                    query: { token: process.env.BEST_HUB_CLIENT_TOKEN },
                },
                spec: {
                    browser: 'chrome',
                    version: '76',
                },
            },
        },
    ],
};
