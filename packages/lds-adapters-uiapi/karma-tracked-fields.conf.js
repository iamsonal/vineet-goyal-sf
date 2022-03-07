const baseConfig = require('@salesforce/lds-karma');
const camelcase = require('camelcase');

const ADAPTER_MODULE_NAME = 'lds-adapters-uiapi';
const ADAPTER_TEST_UTIL_NAME = 'uiapi-test-util';

const FILES = [
    require.resolve('./karma/dist/uiapi-mock-instrumentation.js'),
    require.resolve(`./karma/dist/${ADAPTER_MODULE_NAME}.js`),
    require.resolve(`./karma/dist/${ADAPTER_TEST_UTIL_NAME}.js`),
    require.resolve('./karma/dist/uiapi-test-setup.js'),
];

const COMPAT_FILES = [
    require.resolve('./karma/dist/compat/uiapi-mock-instrumentation.js'),
    require.resolve(`./karma/dist/compat/${ADAPTER_MODULE_NAME}.js`),
    require.resolve(`./karma/dist/compat/${ADAPTER_TEST_UTIL_NAME}.js`),
    require.resolve('./karma/dist/compat/uiapi-test-setup.js'),
];

module.exports = (config) => {
    baseConfig(config);

    const compat = Boolean(config.compat);
    const index = config.files.findIndex((file) => file.endsWith('/global-setup.js'));
    let files = [
        ...config.files.slice(0, index + 1),
        ...(compat ? COMPAT_FILES : FILES),
        ...config.files.slice(index + 1),
    ];

    files = files
        .filter((file) => {
            return (
                file !== '**/__karma__/**/*.spec.js' && file !== '**/__karma__/**/data/**/*.json'
            );
        })
        .concat([
            '**/createRecord/__karma__/**/*.spec.js',
            '**/createRecord/__karma__/**/data/**/*.json',
            '**/getListUi/__karma__/**/*.spec.js',
            '**/getListUi/__karma__/**/data/**/*.json',
            '**/getMruListUi/__karma__/**/*.spec.js',
            '**/getMruListUi/__karma__/**/data/**/*.json',
            '**/getRecord/__karma__/**/*.spec.js',
            '**/getRecord/__karma__/**/data/**/*.json',
            '**/getRecordTemplateClone/__karma__/**/*.spec.js',
            '**/getRecordTemplateClone/__karma__/**/data/**/*.json',
            '**/getRecordUi/__karma__/**/*.spec.js',
            '**/getRecordUi/__karma__/**/data/**/*.json',
            '**/getRecords/__karma__/**/*.spec.js',
            '**/getRecords/__karma__/**/data/**/*.json',
            '**/getRelatedListRecords/__karma__/**/*.spec.js',
            '**/getRelatedListRecords/__karma__/**/data/**/*.json',
            '**/getRelatedListRecordsBatch/__karma__/**/*.spec.js',
            '**/getRelatedListRecordsBatch/__karma__/**/data/**/*.json',
            '**/updateRecord/__karma__/**/*.spec.js',
            '**/updateRecord/__karma__/**/data/**/*.json',
        ]);

    config.set({
        files,
        lwcPreprocessor: {
            globals: {
                [ADAPTER_MODULE_NAME]: camelcase(ADAPTER_MODULE_NAME),
                [ADAPTER_TEST_UTIL_NAME]: camelcase(ADAPTER_TEST_UTIL_NAME),
            },
        },
        client: {
            args: ['ldsTrackedFieldsConfig'],
        },
    });
};
