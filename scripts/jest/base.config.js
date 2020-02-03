module.exports = {
    // Override the default "jsdom" test environment in favor of "node" in order to improve tests
    // startup time.
    // https://jestjs.io/docs/en/configuration#testenvironment-string
    testEnvironment: 'node',

    // Narrow down testMatch to only match against jest unit test files.
    // https://jestjs.io/docs/en/configuration#testmatch-array-string
    testMatch: ['<rootDir>/**/__tests__/*.spec.(js|ts)'],
};
