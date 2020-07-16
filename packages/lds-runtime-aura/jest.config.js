const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-runtime-aura',
    roots: ['<rootDir>/src'],

    coverageThreshold: {
        global: {
            branches: 70,
            functions: 60,
            lines: 70,
        },
    },
};
