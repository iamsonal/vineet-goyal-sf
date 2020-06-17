import typescript from 'rollup-plugin-typescript2';
import path from 'path';
import fs from 'fs';

const defaultConfigs = [
    { formats: ['es', 'umd'], target: 'es2018' },
    { formats: ['umd'], target: 'es5' },
];

const PATHS = {
    '@salesforce/lds-bindings': 'force/ldsBindings',
};

const EXTERNALS = ['@salesforce/lds-bindings', '@salesforce/lds-web-runtime'];

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
 * @param {{
 *  cwd: string,
 *  sfdcEntry: string,
 *  entry: string,
 *  fileName: string,
 *  bundleName: string
 * }} config
 */
function sfdcConfiguration(config) {
    const { sfdcEntry, cwd } = config;
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
            external: EXTERNALS,
            output: {
                file: path.join(sfdcDistFolder, 'index.js'),
                format: 'es',
                paths: PATHS,
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
 *  bundleName: string
 * }} config
 */
function localConfiguration(args, config) {
    const { configTarget, configFormat } = args;
    const { entry, fileName, bundleName, cwd } = config;
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
 *  bundleName: string
 * }} config
 */
export function rollup(config) {
    return args => [...localConfiguration(args, config), ...sfdcConfiguration(config)];
}
