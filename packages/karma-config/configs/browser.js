const base = require('./base');

const lwcDistribution = require('lwc');

const LWC_ENGINE = lwcDistribution.getModulePath('engine', 'umd', 'es2017', 'prod_debug');
const LWC_WIRE_SERVICE = lwcDistribution.getModulePath(
    'wire-service',
    'umd',
    'es2017',
    'prod_debug'
);
const LDS_ENGINE = require.resolve('@ldsjs/engine/dist/umd/es2018/engine.js');
const LWC_LDS = require.resolve('../utils/dist/lwclds.js');
const TEST_UTIL = require.resolve('../utils/dist/test-util.js');
const GLOBAL_SETUP = require.resolve('../utils/dist/global-setup.js');

function getFiles() {
    const files = [];

    files.push(LWC_ENGINE);
    files.push(LWC_WIRE_SERVICE);
    files.push(LDS_ENGINE);
    files.push(LWC_LDS);

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
