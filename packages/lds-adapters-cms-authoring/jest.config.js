const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-adapters-cms-authoring',

    roots: ['<rootDir>/src'],
};
