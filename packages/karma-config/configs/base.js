const path = require('path');
const lwcDistribution = require('lwc');

const karmaPluginLwc = require('../plugins/karma-plugin-lwc');
const karmaPluginCompat = require('../plugins/karma-plugin-compat');

const LWC_ENGINE = lwcDistribution.getModulePath('engine', 'umd', 'es2017', 'prod_debug');
const LWC_ENGINE_COMPAT = lwcDistribution.getModulePath('engine', 'umd', 'es5', 'prod_debug');

const LWC_WIRE_SERVICE = lwcDistribution.getModulePath(
    'wire-service',
    'umd',
    'es2017',
    'prod_debug'
);
const LWC_WIRE_SERVICE_COMPAT = lwcDistribution.getModulePath(
    'wire-service',
    'umd',
    'es5',
    'prod_debug'
);

const LDS_ENGINE = require.resolve('@salesforce-lds/engine/dist/umd/es2018/engine.js');
const LDS_ENGINE_COMPAT = require.resolve('@salesforce-lds/engine/dist/umd/es5/engine.js');

const LWC_LDS = require.resolve('@salesforce-lds/lwc-lds/dist/umd/es2018/lwclds.js');
const LWC_LDS_COMPAT = require.resolve('@salesforce-lds/lwc-lds/dist/umd/es5/lwclds.js');

const POLYFILL_COMPAT = require.resolve('es5-proxy-compat/polyfills.js');
const SHADOW_POLYFILL_COMPAT = lwcDistribution.getModulePath(
    'synthetic-shadow',
    'umd',
    'es5',
    'prod_debug'
);

const TEST_UTIL = require.resolve('../utils/dist/test-util.js');
const TEST_UTIL_COMPAT = require.resolve('../utils/dist/compat/test-util.js');

const GLOBAL_SETUP = require.resolve('../utils/dist/global-setup.js');
const GLOBAL_SETUP_COMPAT = require.resolve('../utils/dist/compat/global-setup.js');

const TIMEKEEPER = require.resolve('timekeeper');
const SINON = require.resolve('sinon/pkg/sinon.js');

function getFiles(compat) {
    const files = [];

    if (compat) {
        files.push(POLYFILL_COMPAT);
        files.push(SHADOW_POLYFILL_COMPAT);
    }

    files.push(TIMEKEEPER);
    files.push(SINON);

    files.push(compat ? LWC_ENGINE_COMPAT : LWC_ENGINE);
    files.push(compat ? LWC_WIRE_SERVICE_COMPAT : LWC_WIRE_SERVICE);
    files.push(compat ? LDS_ENGINE_COMPAT : LDS_ENGINE);
    files.push(compat ? LWC_LDS_COMPAT : LWC_LDS);

    files.push(compat ? TEST_UTIL_COMPAT : TEST_UTIL);
    // The files order matters. global-setup has dependency with test-util.
    files.push(compat ? GLOBAL_SETUP_COMPAT : GLOBAL_SETUP);

    files.push('**/__karma__/matchers.js');
    files.push('**/__karma__/**/*.spec.js');
    files.push({ pattern: '**/__karma__/**/data/**/*.json' });

    return files;
}

module.exports = config => {
    const compat = Boolean(config.compat);

    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: path.resolve('./src'),

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: getFiles(compat),

        // list of files / patterns to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            '**/matchers.js': ['lwc'],
            '**/*.spec.js': ['lwc'],
            '**/*.json': ['json_fixtures'],
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['spec', 'kjhtml'],

        plugins: [
            'karma-jasmine',
            karmaPluginLwc,
            ...(compat ? [karmaPluginCompat] : []),
            'karma-chrome-launcher',
            'karma-json-fixtures-preprocessor',
            'karma-jasmine-html-reporter',
            'karma-spec-reporter',
        ],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,

        // JSON fixture config
        // https://github.com/aaronabramov/karma-json-fixtures-preprocessor
        jsonFixturesPreprocessor: {
            variableName: '__mockData__',
        },
    });
};
