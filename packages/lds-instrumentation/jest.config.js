const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-instrumentation',
    roots: ['<rootDir>/src'],

    // TODO: improve unit test coverage and remove this override
    coverageThreshold: {
        global: {
            branches: 40,
            functions: 40,
            lines: 50,
        },
    },
};
