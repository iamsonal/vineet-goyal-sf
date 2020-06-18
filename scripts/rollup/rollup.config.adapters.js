import typescript from 'rollup-plugin-typescript2';
import path from 'path';
import fs from 'fs';

const PROXY_COMPAT_DISABLE = '/* proxy-compat-disable */';
const generatedFileBanner = [
    '/*  *******************************************************************************************',
    ' *  ATTENTION!',
    ' *  THIS IS A GENERATED FILE FROM https://github.com/salesforce/lds-lightning-platform',
    ' *  If you would like to contribute to LDS, please follow the steps outlined in the git repo.',
    ' *  Any changes made to this file in p4 will be automatically overwritten.',
    ' *  *******************************************************************************************',
    ' */',
];

const banner = generatedFileBanner.concat([PROXY_COMPAT_DISABLE]).join('\n');

const defaultConfigs = [
    { formats: ['es', 'umd'], target: 'es2018' },
    { formats: ['umd'], target: 'es5' },
];

const PATHS = {
    '@salesforce/lds-bindings': 'force/ldsBindings',
};

const EXTERNALS = ['@salesforce/lds-bindings'];

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
 */

/**
 * @param {{
 *  cwd: string,
 *  sfdcEntry: string
 * }} config
 *
 * @param {{
 *   external?: ExternalOption,
 *   paths?: OptionsPaths,
 *   plugins?: Plugin[]
 * }} [overrides]
 */
export function sfdcConfiguration(config, overrides = {}) {
    const { sfdcEntry, cwd } = config;
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
                paths: { ...PATHS, ...overridesOutputPaths },
                plugins: [
                    {
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
 * @param {{
 *  cwd: string,
 *  sfdcEntry: string,
 *  entry: string,
 *  fileName: string,
 *  bundleName: string,
 * }} config
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
 * @param {{
 *  cwd: string,
 *  sfdcEntry: string,
 *  entry: string,
 *  fileName: string,
 *  bundleName: string,
 *  plugins: Plugin[]
 * }} config
 */
export function rollup(config) {
    return args => [...localConfiguration(args, config), ...sfdcConfiguration(config)];
}
