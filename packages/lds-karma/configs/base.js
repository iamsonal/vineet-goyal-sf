const path = require('path');

const karmaPluginLwc = require('../plugins/karma-plugin-lwc');

const TIMEKEEPER = require.resolve('timekeeper');
const SINON = require.resolve('sinon/pkg/sinon.js');

function getTestSpecs() {
    const files = [];

    const { SUITE: SUITE_ENV } = process.env;
    if (SUITE_ENV) {
        files.push(`**/__karma__/**/${SUITE_ENV}.spec.js`);
    } else {
        files.push('**/__karma__/**/*.spec.js');
    }

    files.push('**/__karma__/**/data/**/*.json');

    return files;
}

function getBaseDepFiles() {
    const files = [];

    files.push(TIMEKEEPER);
    files.push(SINON);

    return files;
}

const configBuilder = config => {
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: path.resolve('./src'),

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: getBaseDepFiles(),

        // list of files / patterns to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
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

module.exports = { configBuilder, getTestSpecs };
