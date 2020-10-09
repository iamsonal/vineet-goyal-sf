const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-uiapi-record-utils',
    roots: ['<rootDir>/src'],
};
