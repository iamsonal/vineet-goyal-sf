const path = require('path');

const { buildOverridesMap, resolveModulesWithOverrides } = require('./scripts/ldsModuleOverride');
const baseConfig = require('../../babel.config');

const generatedDir = path.resolve(__dirname, './src/generated');
const overridesDir = path.resolve(__dirname, './src/overrides');
const overrides = buildOverridesMap({ generatedDir, overridesDir });

module.exports = {
    ...baseConfig,

    plugins: [
        [
            require.resolve('babel-plugin-module-resolver'),
            {
                extensions: ['.ts'],
                resolvePath(source, importer, _opts) {
                    const resolved = resolveModulesWithOverrides(source, importer, overrides);
                    return resolved ? resolved : source;
                },
            },
        ],
        ...baseConfig.plugins,
    ],
};
