const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-network-adapter',
    roots: ['<rootDir>/src'],
};
