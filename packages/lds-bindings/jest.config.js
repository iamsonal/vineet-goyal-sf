const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-bindings',
    roots: ['<rootDir>/src'],
};
