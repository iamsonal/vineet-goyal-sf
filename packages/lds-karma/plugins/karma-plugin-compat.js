/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * This transformation is inspired from the karma-rollup-transform:
 * https://github.com/jlmakes/karma-rollup-preprocessor/blob/master/lib/index.js
 */
'use strict';

const path = require('path');
const compatRollupPlugin = require('rollup-plugin-compat');
const { rollup } = require('rollup');

function createPreprocessor(config, logger) {
    const { basePath } = config;

    const plugins = [
        compatRollupPlugin({
            // The compat polyfills are injected at runtime by Karma, polyfills can be shared between all the
            // suites.
            polyfills: false,
        }),
    ];

    const log = logger.create('preprocessor-compat');

    return async (_content, file, done) => {
        const input = file.path;

        try {
            const bundle = await rollup({
                input,
                plugins,
                external: ['proxy-compat'],
            });

            const { output } = await bundle.generate({
                format: 'iife',
                sourcemap: 'inline',

                // The engine and the test-utils is injected as UMD. This mapping defines how those modules can be
                // referenced from the window object.
                globals: {
                    'proxy-compat': 'Proxy',
                },
            });

            let { code, map } = output[0];

            // We need to assign the source to the original file so Karma can source map the error in the console. Add
            // also adding the source map inline for browser debugging.
            // eslint-disable-next-line require-atomic-updates
            file.sourceMap = map;
            code += `\n//# sourceMappingURL=${map.toUrl()}\n`;

            done(null, code);
        } catch (error) {
            const location = path.relative(basePath, file.path);
            log.error('Error processing “%s”\n\n%s\n', location, error.stack || error.message);

            done(error, null);
        }
    };
}

createPreprocessor.$inject = ['config', 'logger'];

module.exports = { 'preprocessor:compat': ['factory', createPreprocessor] };
