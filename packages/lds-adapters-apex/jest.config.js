const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-adapters-apex',

    roots: ['<rootDir>/src'],

    // TODO: improve unit test coverage and remove this override
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 20,
            lines: 40,
        },
    },
};
