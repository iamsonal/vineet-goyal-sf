const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-environment-settings',
    roots: ['<rootDir>/src'],
};
