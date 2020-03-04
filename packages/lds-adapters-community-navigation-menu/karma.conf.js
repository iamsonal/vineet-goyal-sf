const baseConfig = require('@salesforce/lds-karma-config');

const LDS = require.resolve('./karma/dist/lds.js');
const LDS_COMPAT = require.resolve('./karma/dist/compat/lds.js');
const LDS_NATIVE = require.resolve('./karma/dist/ldsNativeProxy.js');

const COMMUNITY_NAVIGATION_MENU = require.resolve('./dist/umd/es2018/community-navigation-menu.js');
const COMMUNITY_NAVIGATION_MENU_COMPAT = require.resolve(
    './dist/umd/es5/community-navigation-menu.js'
);

const COMMUNITY_NAVIGATION_MENU_TEST_UTIL = require.resolve(
    './karma/dist/community-navigation-menu-test-util.js'
);
const COMMUNITY_NAVIGATION_MENU_TEST_UTIL_COMPAT = require.resolve(
    './karma/dist/compat/community-navigation-menu-test-util.js'
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
                        ? COMMUNITY_NAVIGATION_MENU_TEST_UTIL_COMPAT
                        : COMMUNITY_NAVIGATION_MENU_TEST_UTIL
                );
            } else if (file.endsWith('/lwclds.js')) {
                files.push(compat ? COMMUNITY_NAVIGATION_MENU_COMPAT : COMMUNITY_NAVIGATION_MENU);
                files.push(compat ? LDS_COMPAT : native ? LDS_NATIVE : LDS);
            }
        }
    });

    config.set({
        files,
    });
};
