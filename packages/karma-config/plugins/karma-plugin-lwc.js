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
const spawnSync = require('child_process').spawnSync;

const chokidar = require('chokidar');
const { rollup } = require('rollup');
const lwcRollupPlugin = require('@lwc/rollup-plugin');
const compatRollupPlugin = require('rollup-plugin-compat');

// in a test specific directory or has a reserved test filename (e.g. foo.spec.js)
function isTestSource(filename) {
    const re = /(__tests__|__benchmarks__|__karma__)|\.(spec|test)\.(ts|js)$/g;
    return re.test(filename);
}

function isWireSource(filename) {
    return (
        path.extname(filename) === '.ts' &&
        !filename.includes('generated') &&
        !isTestSource(filename)
    );
}

function isRamlSource(filename) {
    return path.extname(filename) === '.raml' && !isTestSource(filename);
}

function setupWatcher(config, emitter, logger) {
    const { basePath } = config;

    const watcher = chokidar.watch(basePath, {
        ignoreInitial: true,
    });

    watcher.on('all', (_type, filename) => {
        if (isWireSource(filename)) {
            spawnSync('yarn', ['build:services'], { stdio: 'inherit' });
        } else if (isRamlSource(filename)) {
            spawnSync('yarn', ['build'], { stdio: 'inherit' });
        } else if (!filename.includes('__karma__')) {
            // not a source file that we ship to the browser and not a test file, ignore
            return;
        }

        logger.info(`Change detected ${path.relative(basePath, filename)}`);
        emitter.refreshFiles();
    });
}

function createPreprocessor(config, emitter, logger) {
    const { basePath, compat } = config;

    const log = logger.create('preprocessor-lwc');

    setupWatcher(config, emitter, log);

    // Cache reused between each compilation to speed up the compilation time.
    let cache;

    const plugins = [
        lwcRollupPlugin({
            // Disable package resolution to avoid lookup in the node_modules directory to boost the initial compilation
            // time.
            resolveFromPackages: false,
        }),
    ];

    if (compat) {
        plugins.push(
            compatRollupPlugin({
                // The compat polyfills are injected at runtime by Karma, polyfills can be shared between all the
                // suites.
                polyfills: false,
            })
        );
    }

    return async (_content, file, done) => {
        const input = file.path;
        const suiteDir = path.dirname(input);

        const banner =
            "typeof process === 'undefined' && (process = { env: { NODE_ENV: 'test' } });";
        let intro;
        let outro;
        // Currently, all matchers are added by global beforeEach
        if (!input.endsWith('matchers.js')) {
            // Wrap all the tests into a describe block with the file stricture name
            const ancestorDirectories = path.relative(basePath, suiteDir).split(path.sep);
            intro = ancestorDirectories.map(tag => `describe("${tag}", function () {`).join('\n');
            outro = ancestorDirectories.map(() => `});`).join('\n');
        }

        try {
            // The engine and the test-util are injected as UMD.
            // This mapping defines how those modules can be referenced from the window object.
            const globals = {
                lds: 'lds',
                'lds-engine': 'ldsEngine',
                lwc: 'LWC',
                sinon: 'sinon',
                'test-util': 'testUtil',
                timekeeper: 'timekeeper',
                'wire-service': 'WireService',
                ...(config.lwcPreprocessor && config.lwcPreprocessor.globals),
            };

            const bundle = await rollup({
                input,
                plugins,
                cache,

                // Rollup should not attempt to resolve the globals, like engine and test-util,
                // Karma takes care of injecting it globally in the page before running the tests.
                external: Object.keys(globals),
            });

            // eslint-disable-next-line require-atomic-updates
            cache = bundle.cache;

            const { output } = await bundle.generate({
                format: 'iife',
                sourcemap: 'inline',
                globals,
                banner,
                ...(intro && { intro, outro }),
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

createPreprocessor.$inject = ['config', 'emitter', 'logger'];

module.exports = { 'preprocessor:lwc': ['factory', createPreprocessor] };
