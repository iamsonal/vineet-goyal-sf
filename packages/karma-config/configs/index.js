const browserConfig = require('./browser');
const browserCompatConfig = require('./browser-compat');
const sauceConfig = require('./sauce');
const nativeConfig = require('./native');

module.exports = function(config) {
    const native = Boolean(config.native);
    const compat = Boolean(config.compat);

    if (process.env.CI !== undefined) {
        return sauceConfig(config);
    }

    if (native) {
        return nativeConfig(config);
    }

    return compat ? browserCompatConfig(config) : browserConfig(config);
};
