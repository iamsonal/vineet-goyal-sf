const baseConfig = require('@salesforce-lds-api/karma-config');

const LDS = require.resolve('./karma/dist/lds.js');
const LDS_COMPAT = require.resolve('./karma/dist/compat/lds.js');

const APEX_SERVICE = require.resolve('./dist/umd/es2018/apex-service.js');
const APEX_SERVICE_COMPAT = require.resolve('./dist/umd/es5/apex-service.js');

const APEX_TEST_UTIL = require.resolve('./karma/dist/apex-test-util.js');
const APEX_TEST_UTIL_COMPAT = require.resolve('./karma/dist/compat/apex-test-util.js');

module.exports = config => {
    baseConfig(config);

    const compat = Boolean(config.compat);
    const files = [];

    config.files.forEach(file => {
        files.push(file);

        // the files order matters
        if (typeof file === 'string') {
            if (file.endsWith('/test-util.js')) {
                files.push(compat ? APEX_TEST_UTIL_COMPAT : APEX_TEST_UTIL);
            } else if (file.endsWith('/lwclds.js')) {
                files.push(compat ? APEX_SERVICE_COMPAT : APEX_SERVICE);
                files.push(compat ? LDS_COMPAT : LDS);
            }
        }
    });

    config.set({
        files,
        lwcPreprocessor: {
            globals: {
                'apex-test-util': 'apexTestUtil',
                '@salesforce/apex': 'lds.apex',
                '@salesforce/apex/ContactController.getContactList':
                    'lds.apexContactControllerGetContactList',
            },
        },
    });
};
