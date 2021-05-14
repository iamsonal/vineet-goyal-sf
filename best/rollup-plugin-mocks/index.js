const path = require('path');

// Best doesn't know how to resolve references that aren't in the same folder structure as core.
// Therefore we have to manually tell rollup where to find these module references.
const SRC_DIR = path.join(__dirname, '../');
const PACKAGES_DIR = path.join(__dirname, '../../packages/');

const EXTERNALS = {
    aura: path.join(SRC_DIR, '/mocks/aura.js'),
    'instrumentation/service': path.join(SRC_DIR, '../best/mocks/auraInstrumentation.js'),
    'force/ldsInstrumentation': path.join(SRC_DIR, '/mocks/ldsInstrumentation.js'),
    'force/ldsStorage': path.join(SRC_DIR, '/mocks/ldsStorage.js'),
    'force/ldsEnvironmentSettings': path.join(SRC_DIR, '/mocks/ldsEnvironmentSettings.js'),
};

module.exports = function() {
    return {
        resolveId(importee) {
            // We need this override to import methods that aren't exposed at module level.
            if (importee.startsWith('lds-adapters-')) {
                return path.join(PACKAGES_DIR, `${importee}`);
            }
            return EXTERNALS[importee];
        },
    };
};
