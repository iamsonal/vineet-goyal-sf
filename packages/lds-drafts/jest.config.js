const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-drafts',
    roots: ['<rootDir>/src'],
};
