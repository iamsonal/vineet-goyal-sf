const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-adapters-commerce-search',

    roots: ['<rootDir>/src'],
};
