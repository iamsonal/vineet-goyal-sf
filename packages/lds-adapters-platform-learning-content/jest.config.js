const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-adapters-platform-learning-content',

    roots: ['<rootDir>/src'],
};
