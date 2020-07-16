const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-aura-storage',
    roots: ['<rootDir>/src'],
};
