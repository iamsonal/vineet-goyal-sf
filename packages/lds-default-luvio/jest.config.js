const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-default-luvio',
    roots: ['<rootDir>/src'],
};
