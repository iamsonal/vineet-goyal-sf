// @ts-check

import typescript from 'rollup-plugin-typescript2';
import path from 'path';
import fs from 'fs';

import { buildBanner, buildFooter } from './rollup-utils';

const banner = buildBanner(true);

const defaultConfigs = [
    { formats: ['es', 'umd'], target: 'es2018' },
    { formats: ['umd'], target: 'es5' },
];

const PATHS = {
    '@salesforce/lds-bindings': 'force/ldsBindings',
    '@salesforce/lds-default-luvio': 'force/ldsEngine',
};

const EXTERNALS = ['@salesforce/lds-bindings', '@salesforce/lds-default-luvio'];

/**
 * @param {string} cwd
 */
function getDistDir(cwd) {
    return path.join(cwd, 'dist');
}

/**
 * @param {string} cwd
 */
function getTypesDir(cwd) {
    return path.join(getDistDir(cwd), 'types');
}

/**
 * @typedef { import("rollup").ExternalOption } ExternalOption
 * @typedef { import('rollup').OptionsPaths } OptionsPaths
 * @typedef { import('rollup').Plugin } Plugin
 * @typedef { import('rollup').RollupOptions } RollupOptions
 *
 * @typedef AdapterRollupConfig
 * @prop {string} cwd
 * @prop {string} sfdcEntry
 * @prop {string} entry
 * @prop {string} fileName
 * @prop {string} bundleName
 * @prop {string} packageVersion
 */

/**
 * @param {AdapterRollupConfig} config
 *
 * @param {{
 *   external?: string[],
 *   paths?: OptionsPaths,
 *   outputPaths?: OptionsPaths,
 *   plugins?: Plugin[]
 * }} [overrides]
 *
 * @returns {RollupOptions[]}
 */
export function sfdcConfiguration(config, overrides = {}) {
    const { sfdcEntry, cwd, packageVersion } = config;
    const {
        external: overridesExternals = [],
        outputPaths: overridesOutputPaths = {},
        plugins: overridesPlugins = [],
    } = overrides;

    const sfdcDistFolder = path.join(cwd, 'sfdc');
    const sfdcEntryDirectoryLocal = path.relative(cwd, sfdcEntry);
    const typesDir = getTypesDir(cwd);
    const relativePathFromSfdcEntryToTypesDist = path.relative(sfdcDistFolder, typesDir);
    const typesImportPath = path.join(
        relativePathFromSfdcEntryToTypesDist,
        path.dirname(sfdcEntryDirectoryLocal),
        path.basename(sfdcEntryDirectoryLocal, path.extname(sfdcEntryDirectoryLocal))
    );

    return [
        {
            input: sfdcEntry,
            external: [...EXTERNALS, ...overridesExternals],
            output: {
                file: path.join(sfdcDistFolder, 'index.js'),
                format: 'es',
                banner,
                footer: buildFooter(packageVersion),
                paths: { ...PATHS, ...overridesOutputPaths },
                plugins: [
                    {
                        name: 'LDS Types Exporter',
                        writeBundle() {
                            fs.writeFileSync(
                                path.join(sfdcDistFolder, 'index.d.ts'),
                                `export * from '${typesImportPath}';`
                            );
                        },
                    },
                ],
            },
            plugins: [
                ...overridesPlugins,
                typescript({
                    clean: false,
                    // @ts-ignore (rollup-plugin-typescript2 types are missing cwd)
                    cwd,
                    tsconfigOverride: {
                        compilerOptions: {
                            declaration: false,
                        },
                    },
                }),
            ],
        },
    ];
}

/**
 * @param {{
 *  configTarget: string,
 *  configFormat: string,
 * }} args
 * @param {AdapterRollupConfig} config
 * @param {{
 *   plugins?: Plugin[]
 * }} [overrides]
 */
export function localConfiguration(args, config, overrides = {}) {
    const { configTarget, configFormat } = args;
    const { entry, fileName, bundleName, cwd } = config;
    const { plugins: overridesPlugins = [] } = overrides;
    const dist = getDistDir(cwd);
    const typesDir = getTypesDir(cwd);

    return defaultConfigs
        .filter(config => configTarget === undefined || configTarget === config.target)
        .map(config => {
            const output = config.formats
                .filter(format => configFormat === undefined || configFormat === format)
                .map(format => ({
                    file: path.join(dist, format, config.target, `${fileName}.js`),
                    format,
                    name: bundleName,
                }));

            return {
                input: entry,
                output,
                plugins: [
                    ...overridesPlugins,
                    typescript({
                        clean: true,
                        useTsconfigDeclarationDir: true,
                        tsconfigOverride: {
                            compilerOptions: {
                                composite: true,
                                declarationDir: typesDir,
                                target: config.target,
                            },
                        },
                    }),
                ],
            };
        });
}

/**
 * @param {AdapterRollupConfig} config
 */
export function rollup(config) {
    return args => [...localConfiguration(args, config), ...sfdcConfiguration(config)];
}
