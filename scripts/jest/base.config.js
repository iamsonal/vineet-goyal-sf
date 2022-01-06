module.exports = {
    // Override the default "jsdom" test environment in favor of "node" in order to improve tests
    // startup time.
    // https://jestjs.io/docs/en/configuration#testenvironment-string
    testEnvironment: 'node',
    testRunner: 'jest-jasmine2',

    // Narrow down testMatch to only match against jest unit test files.
    // https://jestjs.io/docs/en/configuration#testmatch-array-string
    testMatch: ['<rootDir>/**/__tests__/**/*.spec.(js|ts)'],

    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
        },
    },

    collectCoverageFrom: [
        '**/*.{js,ts}',
        '!**/node_modules/**',
        '!**/__karma__/**',
        '!**/__tests__/**',
        '!**/__benchmarks__/**',
        '!**/mocks/**',
        '!**/fixtures/**',
        '!**/generated/**',
    ],
};
