const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-adapters-analytics-wave',
    roots: ['<rootDir>/src'],
};
