const browserConfig = require('./browser');
const browserCompatConfig = require('./browser-compat');
const sauceConfig = require('./sauce');

module.exports = function (config) {
    const compat = Boolean(config.compat);

    if (process.env.CI !== undefined) {
        return sauceConfig(config);
    }

    return compat ? browserCompatConfig(config) : browserConfig(config);
};
