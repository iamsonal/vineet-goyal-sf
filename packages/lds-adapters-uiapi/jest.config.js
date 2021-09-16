const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-adapters-uiapi',
    roots: ['<rootDir>/src'],

    // eslint-disable-next-line @salesforce/lds/no-invalid-todo
    // TODO: improve unit test coverage and remove this override
    coverageThreshold: {
        global: {
            branches: 40,
            functions: 40,
            lines: 25,
        },
    },
    // sfdc bundle is generated and only imperative adapters are tested from this file
    // this brings the coverage down from the required threshhold level
    coveragePathIgnorePatterns: ['<rootDir>/sfdc'],
};
