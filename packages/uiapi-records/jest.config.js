const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce-lds-api/uiapi-records',

    roots: ['<rootDir>/src'],
};
