const path = require('path');

const baseConfig = require('../../scripts/jest/base.config');

const babelConfig = path.resolve(__dirname, 'babel.config.js');

module.exports = {
    ...baseConfig,

    // by default jest looks for babel config at cwd - so different behavior
    // depending on where you launched jest... so we explicitly say where
    // to find the babel config file by overriding the default transform
    transform: { '^.+\\.[jt]sx?$': ['babel-jest', { configFile: babelConfig }] },

    displayName: '@salesforce/lds-adapters-uiapi',

    roots: ['<rootDir>/src'],
};
