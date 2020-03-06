const baseConfig = require('@salesforce/lds-karma-config');

const LDS = require.resolve('./karma/dist/lds.js');
const LDS_COMPAT = require.resolve('./karma/dist/compat/lds.js');
const LDS_NATIVE = require.resolve('./karma/dist/ldsNativeProxy.js');

const COMMERCE_STORE_PRICING = require.resolve('./dist/umd/es2018/commerce-store-pricing.js');
const COMMERCE_STORE_PRICING_COMPAT = require.resolve('./dist/umd/es5/commerce-store-pricing.js');

const COMMERCE_STORE_PRICING_TEST_UTIL = require.resolve(
    './karma/dist/commerce-store-pricing-test-util.js'
);
const COMMERCE_STORE_PRICING_TEST_UTIL_COMPAT = require.resolve(
    './karma/dist/compat/commerce-store-pricing-test-util.js'
);

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
                files.push(
                    compat
                        ? COMMERCE_STORE_PRICING_TEST_UTIL_COMPAT
                        : COMMERCE_STORE_PRICING_TEST_UTIL
                );
            } else if (file.endsWith('/lwclds.js')) {
                files.push(compat ? COMMERCE_STORE_PRICING_COMPAT : COMMERCE_STORE_PRICING);
                files.push(compat ? LDS_COMPAT : native ? LDS_NATIVE : LDS);
            }
        }
    });

    config.set({
        files,
    });
};