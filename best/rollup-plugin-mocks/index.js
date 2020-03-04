const path = require('path');

// Best doesn't know how to resolve references that aren't in the same folder structure as core.
// Therefore we have to manually tell rollup where to find these module references.
const SRC_DIR = path.join(__dirname, '../');

const EXTERNALS = {
    'instrumentation/service': path.join(SRC_DIR, '../best/mocks/auraInstrumentation.js'),
};

module.exports = function() {
    return {
        resolveId(importee) {
            return EXTERNALS[importee];
        },
    };
};
