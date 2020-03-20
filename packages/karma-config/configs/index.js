const browserConfig = require('./browser');
const browserCompatConfig = require('./browser-compat');
const sauceConfig = require('./sauce');
const webviewConfig = require('./webview');

module.exports = function(config) {
    const webview = Boolean(config.webview);
    const compat = Boolean(config.compat);

    if (process.env.CI !== undefined) {
        return sauceConfig(config);
    }

    if (webview) {
        return webviewConfig(config);
    }

    return compat ? browserCompatConfig(config) : browserConfig(config);
};
