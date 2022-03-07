const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-graphql-eval',
    roots: ['<rootDir>/src'],
    transformIgnorePatterns: ['/node_modules/(?!@luvio/graphql-parser)'], // this module uses ES syntax instead of CJS
};
