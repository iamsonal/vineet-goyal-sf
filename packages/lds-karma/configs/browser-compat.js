const base = require('./base');

const lwcDistribution = require('lwc');

const karmaPluginCompat = require('../plugins/karma-plugin-compat');

const LWC_ENGINE_COMPAT = lwcDistribution.getModulePath('engine', 'umd', 'es5', 'prod_debug');

const POLYFILL_COMPAT = require.resolve('es5-proxy-compat/polyfills.js');
const SHADOW_POLYFILL_COMPAT = lwcDistribution.getModulePath(
    'synthetic-shadow',
    'umd',
    'es5',
    'prod_debug'
);

const LDS_ENGINE_COMPAT = require.resolve('../dist/compat/lds-runtime-browser.js');
const LDS_BINDINGS_COMPAT = require.resolve('../dist/compat/lds-bindings.js');

const BROWSER_TEST_UTILS_COMPAT = require.resolve('../dist/compat/utils/browser-test-utils.js');
const TEST_UTIL_COMPAT = require.resolve('../dist/compat/utils/test-util.js');
const GLOBAL_SETUP_COMPAT = require.resolve('../dist/compat/utils/global-setup.js');

function getFiles() {
    const files = [];

    // LWC
    files.push(POLYFILL_COMPAT);
    files.push(SHADOW_POLYFILL_COMPAT);
    files.push(LWC_ENGINE_COMPAT);

    // LDS
    files.push(LDS_ENGINE_COMPAT);
    files.push(LDS_BINDINGS_COMPAT);

    // Test Utils
    files.push(BROWSER_TEST_UTILS_COMPAT);
    files.push(TEST_UTIL_COMPAT);
    // The files order matters. global-setup has dependency with test-util.
    files.push(GLOBAL_SETUP_COMPAT);

    return files;
}

module.exports = function (config) {
    // Apply the base config first with common configurations.
    base.configBuilder(config);

    config.set({
        // order matters, load base deps then impl deps then test specs
        files: [...config.files, ...getFiles(), ...base.getTestSpecs()],

        plugins: [...config.plugins, karmaPluginCompat],
    });
};
