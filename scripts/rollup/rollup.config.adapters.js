import typescript from 'rollup-plugin-typescript2';
import path from 'path';

const defaultConfigs = [
    { formats: ['es', 'umd'], target: 'es2018' },
    { formats: ['umd'], target: 'es5' },
];

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
    const tsConfig = path.join(cwd, 'tsconfig.json');
    const dist = path.join(__dirname, 'sfdc');

    return [
        {
            input: sfdcEntry,
            external: ['@salesforce/lds-bindings'],
            output: {
                file: path.join(dist, 'index.js'),
                format: 'es',
                paths: {
                    '@salesforce/lds-bindings': 'force/ldsBindings',
                },
            },
            plugins: [
                typescript({
                    clean: true,
                    tsconfig: tsConfig,
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
    const { entry, fileName, bundleName } = config;
    const dist = path.join(__dirname, 'dist');

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
                        tsconfigOverride: {
                            compilerOptions: {
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
    return args => [...sfdcConfiguration(config), ...localConfiguration(args, config)];
}
