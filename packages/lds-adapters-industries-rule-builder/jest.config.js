const baseConfig = require('../../scripts/jest/base.config');
module.exports = {
    ...baseConfig,
    displayName: '@salesforce/lds-adapters-industries-rule-builder',
    roots: ['<rootDir>/src'],
};
