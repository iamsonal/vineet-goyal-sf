const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-compiler-plugins',

    roots: ['<rootDir>/src'],
};
