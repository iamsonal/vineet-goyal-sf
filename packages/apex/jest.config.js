const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce-lds-api/apex',

    roots: ['<rootDir>/src'],
};
