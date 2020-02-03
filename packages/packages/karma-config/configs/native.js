const base = require('./base');

const path = require('path');
const lwcDistribution = require('lwc');

const LWC_ENGINE = lwcDistribution.getModulePath('engine', 'umd', 'es2017', 'prod_debug');
const LWC_WIRE_SERVICE = lwcDistribution.getModulePath(
    'wire-service',
    'umd',
    'es2017',
    'prod_debug'
);
const LDS_ENGINE = require.resolve('@salesforce-lds/engine/dist/umd/es2018/engine.js');
const LWC_LDS = require.resolve('@salesforce-lds/lwc-lds/dist/umd/es2018/lwclds.js');
const TEST_UTIL = require.resolve('../utils/dist/test-util.js');
const GLOBAL_SETUP = require.resolve('../utils/dist/global-setup.js');

function getFiles() {
    // TODO - W-6870793 - currently the "native" test runner is actually the
    // same as the browser runner - this will get fixed shortly
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
        files: [...config.files, ...getFiles(), ...base.getTestSpecs(true)],

        plugins: [...config.plugins, 'karma-android-hybrid-app-launcher'],

        browsers: ['AndroidHybridApp'],

        androidHybridApp: {
            packageId: 'com.salesforce.ldsandroidhybridtestapp',
            // NOTE: the source code for the checked in APK is at https://github.com/salesforce/lds-android-hybrid-test-app
            apkPath: path.join(__dirname, '../native/lds-android-hybrid-test-app.apk'),
        },
    });
};
