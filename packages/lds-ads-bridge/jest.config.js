const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-ads-bridge',
    roots: ['<rootDir>/src'],
};
