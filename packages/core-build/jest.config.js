module.exports = {
    // Override the default "jsdom" test environment in favor of "node" in order to improve tests
    // startup time.
    // https://jestjs.io/docs/en/configuration#testenvironment-string
    testEnvironment: 'node',

    // Narrow down testMatch to only match against jest unit test files.
    // https://jestjs.io/docs/en/configuration#testmatch-array-string
    testMatch: ['<rootDir>/**/__tests__/*.spec.(js|ts)'],

    displayName: 'core-build',
    roots: ['<rootDir>/src'],
    moduleNameMapper: {
        'lds-static-functions': '<rootDir>/src/lds/lds-static-functions.ts',
    },

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
            functions: 75,
            lines: 45,
        },
    },

    collectCoverageFrom: ['**/*.{js,ts}', '!**/node_modules/**', '!**/__tests__/**'],
};
