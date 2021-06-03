const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-adapters-revenue-billing-batch',

    roots: ['<rootDir>/src'],
};
