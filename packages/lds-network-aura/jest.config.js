const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-network-aura',
    roots: ['<rootDir>/src'],
};
