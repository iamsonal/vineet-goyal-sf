const baseConfig = require('../../scripts/jest/base.config');

module.exports = {
    ...baseConfig,

    displayName: '@salesforce/lds-runtime-mobile',
    roots: ['<rootDir>/src'],

    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
        },
    },
    transformIgnorePatterns: ['../node_modules/@salesforce/user/(.*)'],
    setupFilesAfterEnv: ['./jest.setup.js'],
};
