const base = require('./base');

const lwcDistribution = require('lwc');

const karmaPluginCompat = require('../plugins/karma-plugin-compat');

const LWC_ENGINE_COMPAT = lwcDistribution.getModulePath('engine', 'umd', 'es5', 'prod_debug');

const LWC_WIRE_SERVICE_COMPAT = lwcDistribution.getModulePath(
    'wire-service',
    'umd',
    'es5',
    'prod_debug'
);
const LDS_ENGINE_COMPAT = require.resolve('@salesforce-lds/engine/dist/umd/es5/engine.js');
const LWC_LDS_COMPAT = require.resolve('@salesforce-lds/lwc-lds/dist/umd/es5/lwclds.js');
const POLYFILL_COMPAT = require.resolve('es5-proxy-compat/polyfills.js');
const SHADOW_POLYFILL_COMPAT = lwcDistribution.getModulePath(
    'synthetic-shadow',
    'umd',
    'es5',
    'prod_debug'
);
const TEST_UTIL_COMPAT = require.resolve('../utils/dist/compat/test-util.js');
const GLOBAL_SETUP_COMPAT = require.resolve('../utils/dist/compat/global-setup.js');

function getFiles() {
    const files = [];

    files.push(POLYFILL_COMPAT);
    files.push(SHADOW_POLYFILL_COMPAT);

    files.push(LWC_ENGINE_COMPAT);
    files.push(LWC_WIRE_SERVICE_COMPAT);
    files.push(LDS_ENGINE_COMPAT);
    files.push(LWC_LDS_COMPAT);

    files.push(TEST_UTIL_COMPAT);
    // The files order matters. global-setup has dependency with test-util.
    files.push(GLOBAL_SETUP_COMPAT);

    return files;
}

module.exports = function(config) {
    // Apply the base config first with common configurations.
    base.configBuilder(config);

    config.set({
        // order matters, load base deps then impl deps then test specs
        files: [...config.files, ...getFiles(), ...base.getTestSpecs()],

        plugins: [...config.plugins, karmaPluginCompat],
    });
};
