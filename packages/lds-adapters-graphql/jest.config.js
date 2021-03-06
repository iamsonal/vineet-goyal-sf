const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-adapters-graphql',
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
    transformIgnorePatterns: ['/node_modules/(?!@luvio/graphql-parser)'], // this module uses ES syntax instead of CJS
};
