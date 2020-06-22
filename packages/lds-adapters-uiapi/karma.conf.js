const baseConfig = require('@salesforce/lds-karma');
const camelcase = require('camelcase');

const ADAPTER_MODULE_NAME = 'lds-adapters-uiapi';
const ADAPTER_TEST_UTIL_NAME = 'uiapi-test-util';

const FILES = [
    require.resolve(`./karma/dist/${ADAPTER_MODULE_NAME}.js`),
    require.resolve(`./karma/dist/${ADAPTER_TEST_UTIL_NAME}.js`),
    require.resolve('./karma/dist/uiapi-test-setup.js'),
];

const COMPAT_FILES = [
    require.resolve(`./karma/dist/compat/${ADAPTER_MODULE_NAME}.js`),
    require.resolve(`./karma/dist/compat/${ADAPTER_TEST_UTIL_NAME}.js`),
    require.resolve('./karma/dist/compat/uiapi-test-setup.js'),
];

module.exports = config => {
    baseConfig(config);

    const compat = Boolean(config.compat);
    const index = config.files.findIndex(file => file.endsWith('/global-setup.js'));
    const files = [
        ...config.files.slice(0, index + 1),
        ...(compat ? COMPAT_FILES : FILES),
        ...config.files.slice(index + 1),
    ];

    config.set({
        files,
        lwcPreprocessor: {
            globals: {
                [ADAPTER_MODULE_NAME]: camelcase(ADAPTER_MODULE_NAME),
                [ADAPTER_TEST_UTIL_NAME]: camelcase(ADAPTER_TEST_UTIL_NAME),
            },
        },
    });
};
