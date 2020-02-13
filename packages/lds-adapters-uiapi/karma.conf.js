const baseConfig = require('@salesforce/lds-karma-config');

const LDS = require.resolve('./karma/dist/lds.js');
const LDS_COMPAT = require.resolve('./karma/dist/compat/lds.js');
const LDS_NATIVE = require.resolve('./karma/dist/ldsNativeProxy.js');

const UIAPI_RECORD_SERVICE = require.resolve('./dist/umd/es2018/uiapi-records-service.js');
const UIAPI_RECORD_SERVICE_COMPAT = require.resolve('./dist/umd/es5/uiapi-records-service.js');

const UIAPI_TEST_UTIL = require.resolve('./karma/dist/uiapi-test-util.js');
const UIAPI_TEST_UTIL_COMPAT = require.resolve('./karma/dist/compat/uiapi-test-util.js');

const UIAPI_TEST_SETUP = require.resolve('./karma/dist/uiapi-test-setup.js');
const UIAPI_TEST_SETUP_COMPAT = require.resolve('./karma/dist/compat/uiapi-test-setup.js');

module.exports = config => {
    baseConfig(config);

    const compat = Boolean(config.compat);
    const native = Boolean(config.native);
    const files = [];

    config.files.forEach(file => {
        files.push(file);

        // the files order matters
        if (typeof file === 'string') {
            if (file.endsWith('/test-util.js')) {
                files.push(compat ? UIAPI_TEST_UTIL_COMPAT : UIAPI_TEST_UTIL);
            } else if (file.endsWith('/global-setup.js')) {
                files.push(compat ? UIAPI_TEST_SETUP_COMPAT : UIAPI_TEST_SETUP);
            } else if (file.endsWith('/lwclds.js')) {
                files.push(compat ? UIAPI_RECORD_SERVICE_COMPAT : UIAPI_RECORD_SERVICE);
                files.push(compat ? LDS_COMPAT : native ? LDS_NATIVE : LDS);
            }
        }
    });

    config.set({
        files,
        lwcPreprocessor: {
            globals: {
                'uiapi-test-util': 'uiApiTestUtil',
            },
        },
    });
};
