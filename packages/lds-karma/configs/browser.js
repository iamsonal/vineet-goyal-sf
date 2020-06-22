const base = require('./base');

const lwcDistribution = require('lwc');

const LWC_ENGINE = lwcDistribution.getModulePath('engine', 'umd', 'es2017', 'prod_debug');

const LDS_ENGINE = require.resolve('../dist/lds-runtime-browser.js');
const LDS_BINDINGS = require.resolve('../dist/lds-bindings.js');

const BROWSER_TEST_UTILS = require.resolve('../dist/utils/browser-test-utils.js');
const TEST_UTIL = require.resolve('../dist/utils/test-util.js');
const GLOBAL_SETUP = require.resolve('../dist/utils/global-setup.js');

function getFiles() {
    const files = [];

    // LWC
    files.push(LWC_ENGINE);

    // LDS
    files.push(LDS_ENGINE);
    files.push(LDS_BINDINGS);

    // Test Utils
    files.push(BROWSER_TEST_UTILS);
    files.push(TEST_UTIL);
    // The files order matters. global-setup has dependency with test-util.
    files.push(GLOBAL_SETUP);

    return files;
}

module.exports = function(config) {
    // Apply the base config first with common configurations.
    base.configBuilder(config);

    config.set({
        // order matters, load base deps then impl deps then test specs
        files: [...config.files, ...getFiles(), ...base.getTestSpecs()],
    });
};
