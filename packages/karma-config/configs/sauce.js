const baseConfig = require('./base');

const SAUCE_BROWSERS = {
    sl_chrome_latest: {
        base: 'SauceLabs',
        browserName: 'chrome',
        version: 'latest',
    },
    sl_firefox_latest: {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: 'latest',
    },
};

const SAUCE_COMPAT_BROWSERS = {
    sl_ie11: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '11.0',
    },
    sl_chrome_compat: {
        base: 'SauceLabs',
        browserName: 'chrome',
        version: '59',
    },
    sl_firefox_compat: {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: '54',
    },
};

module.exports = function(config) {
    // Apply the base config first with common configurations.
    baseConfig(config);

    const username = process.env.SAUCE_USERNAME;
    if (!username) {
        throw new TypeError('Missing SAUCE_USERNAME environment variable');
    }

    const accessKey = process.env.SAUCE_ACCESS_KEY || process.env.SAUCE_KEY;
    if (!accessKey) {
        throw new TypeError('Missing SAUCE_ACCESS_KEY or SAUCE_KEY environment variable');
    }

    const buildId = process.env.CIRCLE_BUILD_NUM || Date.now();
    let sauceLabs = {
        username,
        accessKey,

        testName: 'lds-integration',
        build: `lds-integration - ${buildId}`,
    };

    // Skip sauce connect launch if a sauce connect tunnel id is already provided.
    if (process.env.SAUCE_TUNNEL_ID !== undefined) {
        sauceLabs = {
            ...sauceLabs,
            tunnelIdentifier: process.env.SAUCE_TUNNEL_ID,
            startConnect: false,
        };
    }

    const browsers = config.compat ? SAUCE_COMPAT_BROWSERS : SAUCE_BROWSERS;

    config.set({
        sauceLabs: sauceLabs,

        browsers: Object.keys(browsers),
        customLaunchers: browsers,

        reporters: [...config.reporters, 'saucelabs'],

        plugins: [...config.plugins, 'karma-sauce-launcher'],

        // Force Karma to run in singleRun mode in order to shutdown the server after the tests
        // finished to run.
        singleRun: true,
    });
};
