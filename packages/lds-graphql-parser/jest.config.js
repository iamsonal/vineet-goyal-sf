const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-graphql-parser',
    roots: ['<rootDir>/src'],
};
