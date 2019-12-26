const path = require('path');

module.exports = {
    rootDir: path.resolve(__dirname, '../..'),

    projects: ['<rootDir>/packages/**/jest.config.js'],

    /**
     * There are a couple caveats with how Jest handles the code coverage thresholds here:
     *
     * 1. Coverage thresholds must be defined here and not at the individual project jest config.
     *    Related issue: https://github.com/facebook/jest/issues/6998
     *
     * 2. Any files that match the filepath glob pattern will be excluded from the global
     *    thresholds. This means that the true overall coverage may be lower than what is defined
     *    here under the global config. Ideally, you would be able to define individual thresholds
     *    and have a true global threshold that accounted for all files even if they also match a
     *    more specific glob pattern (see issue below).
     *    Related issue: https://github.com/facebook/jest/issues/5427
     */
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
        },
        'packages/@salesforce-lds/compiler/src': {
            branches: 70,
            functions: 90,
            lines: 90,
        },
        'packages/@salesforce-lds/engine/src': {
            branches: 0,
            functions: 0,
            lines: 0,
        },
        'packages/@salesforce-lds/lwc-lds/src': {
            branches: 5,
            functions: 10,
            lines: 20,
        },
        'packages/@salesforce-lds-api/uiapi-records/src': {
            branches: 15,
            functions: 10,
            lines: 20,
        },
        'packages/@salesforce-lds-api/apex/src': {
            branches: 15,
            functions: 10,
            lines: 20,
        },
        'packages/core-build/src': {
            branches: 70,
            functions: 85,
            lines: 45,
        },
    },

    collectCoverageFrom: [
        '**/*.{js,ts}',
        '!**/lds222/**',
        '!**/node_modules/**',
        '!**/__karma__/**',
        '!**/__tests__/**',
        '!**/__benchmarks__/**',
        '!**/fixtures/**',
        '!**/generated/**',
    ],
};
