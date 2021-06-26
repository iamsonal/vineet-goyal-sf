const baseConfig = require('../../scripts/jest/base.config');

const nodeModulesNeedingTransformed = [
    '@salesforce/lds-runtime-mobile',
    '@salesforce/lds-adapters-uiapi/sfdc',
    '@salesforce/lds-adapters-graphql/sfdc',
    '@salesforce/lds-bindings',
    '@salesforce/lds-graphql-parser',
    '@mobileplatform/nimbus-plugin-lds',
];

module.exports = {
    ...baseConfig,

    displayName: '@mobileplatform/lds-worker-api',
    roots: ['<rootDir>/src'],

    collectCoverageFrom: [...baseConfig.collectCoverageFrom, '!**/standalone-stubs/**'],

    moduleNameMapper: {
        lwc: require.resolve('./src/standalone-stubs/unwrap.ts'),
        'force/ldsBindings': '@salesforce/lds-bindings',
        'force/ldsEngine': '@salesforce/lds-runtime-mobile',
        'native/ldsEngineMobile': '@salesforce/lds-runtime-mobile',
        'lightning/ui(.*)Api': '@salesforce/lds-adapters-uiapi/sfdc',
        'lightning/unstable_ui(.*)Api': '@salesforce/lds-adapters-uiapi/sfdc',
        'force/ldsAdaptersGraphql': '@salesforce/lds-adapters-graphql/sfdc',
        'force/ldsAdaptersUiapi': '@salesforce/lds-adapters-uiapi/sfdc',
        'o11y/client': require.resolve('./src/standalone-stubs/o11y.ts'),
        'force/ldsInstrumentation': require.resolve('./src/standalone-stubs/instrumentation.ts'),
        '@salesforce/user/Id': require.resolve('./src/standalone-stubs/salesforce-user-id.ts'),
    },

    setupFilesAfterEnv: ['<rootDir>/src/__tests__/test-setup.js'],

    // JEST can't handle ESM so we have to tell it to transform some of the
    // node_modules that only export ESM.  This stinks because it makes it harder
    // to debug jest tests.
    // TODO - when jest supports ESM natively (https://github.com/facebook/jest/issues/9430)
    // get rid of the esm-to-cjs transform - ie: remove the below line and get
    // rid of the plugin-transform-modules-commonjs in babel config
    transformIgnorePatterns: [
        `/node_modules/(?!(${nodeModulesNeedingTransformed.join('|')})).+\\.js$`,
    ],
};
