const browserConfig = require('./browser');
const browserCompatConfig = require('./browser-compat');

const idleTimeout = 300;

const SAUCE_BROWSERS = {
    sl_chrome_latest: {
        base: 'SauceLabs',
        browserName: 'chrome',
        version: 'latest',
        idleTimeout,
    },
    sl_firefox_latest: {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: 'latest',
        idleTimeout,
    },
};

const SAUCE_COMPAT_BROWSERS = {
    sl_ie11: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '11.0',
        idleTimeout,
    },
};

const SAUCE_FULL_COMPAT_BROWSERS = {
    ...SAUCE_COMPAT_BROWSERS,
    sl_chrome_compat: {
        base: 'SauceLabs',
        browserName: 'chrome',
        version: '59',
        idleTimeout,
    },
    sl_firefox_compat: {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: '54',
        idleTimeout,
    },
};

module.exports = function (config) {
    const compat = Boolean(config.compat);

    if (compat) {
        browserCompatConfig(config);
    } else {
        browserConfig(config);
    }

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

    const browsers = compat
        ? process.env.FULL_COMPAT_TEST
            ? SAUCE_FULL_COMPAT_BROWSERS
            : SAUCE_COMPAT_BROWSERS
        : SAUCE_BROWSERS;

    config.set({
        sauceLabs: sauceLabs,

        browsers: Object.keys(browsers),
        customLaunchers: browsers,
        concurrency: Infinity,

        // Sometimes Saucelabs gets stuck.
        // Retry when it does, so we can get better results without manual resets.
        browserDisconnectTolerance: 3,
        browserDisconnectTimeout: 15000,
        browserNoActivityTimeout: 60000,

        reporters: [...config.reporters, 'saucelabs'],

        plugins: [...config.plugins, 'karma-sauce-launcher'],

        // Force Karma to run in singleRun mode in order to shutdown the server after the tests
        // finished to run.
        singleRun: true,
    });
};
