const baseConfig = require('@salesforce/lds-karma');
const camelcase = require('camelcase');

const GRAPHQL_ADAPTER_MODULE_NAME = 'lds-adapters-graphql';
const UIAPI_ADAPTER_MODULE_NAME = 'lds-adapters-uiapi';
const ADAPTER_TEST_UTIL_NAME = 'graphql-test-util';

const FILES = [
    require.resolve('../lds-adapters-uiapi/karma/dist/uiapi-mock-instrumentation.js'),
    require.resolve(`../lds-adapters-uiapi/karma/dist/${UIAPI_ADAPTER_MODULE_NAME}.js`),
    require.resolve(`./karma/dist/${GRAPHQL_ADAPTER_MODULE_NAME}.js`),
    require.resolve(`./karma/dist/${ADAPTER_TEST_UTIL_NAME}.js`),
];

const COMPAT_FILES = [
    require.resolve('../lds-adapters-uiapi/karma/dist/compat/uiapi-mock-instrumentation.js'),
    require.resolve(`../lds-adapters-uiapi/karma/dist/compat/${UIAPI_ADAPTER_MODULE_NAME}.js`),
    require.resolve(`./karma/dist/compat/${GRAPHQL_ADAPTER_MODULE_NAME}.js`),
    require.resolve(`./karma/dist/compat/${ADAPTER_TEST_UTIL_NAME}.js`),
];

module.exports = (config) => {
    baseConfig(config);

    const compat = Boolean(config.compat);
    const index = config.files.findIndex((file) => file.endsWith('/global-setup.js'));
    const files = [
        ...config.files.slice(0, index + 1),
        ...(compat ? COMPAT_FILES : FILES),
        ...config.files.slice(index + 1),
    ];

    config.set({
        files,
        lwcPreprocessor: {
            globals: {
                [GRAPHQL_ADAPTER_MODULE_NAME]: camelcase(GRAPHQL_ADAPTER_MODULE_NAME),
                [UIAPI_ADAPTER_MODULE_NAME]: camelcase(UIAPI_ADAPTER_MODULE_NAME),
                [ADAPTER_TEST_UTIL_NAME]: camelcase(ADAPTER_TEST_UTIL_NAME),
            },
        },
    });
};
