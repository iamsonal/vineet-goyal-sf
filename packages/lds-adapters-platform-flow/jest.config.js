const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,
    displayName: '@salesforce/lds-adapters-platform-flow',
    roots: ['<rootDir>/src'],
};
