const baseConfig = require('./base');
const sauceConfig = require('./sauce');

module.exports = function(config) {
    return process.env.CI !== undefined ? sauceConfig(config) : baseConfig(config);
};
