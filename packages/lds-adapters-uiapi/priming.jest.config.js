const baseConfig = require('./jest.config.js');

module.exports = {
    ...baseConfig,
    testMatch: ['<rootDir>/**/__performance__/**/*.spec.(js|ts)'],
};
