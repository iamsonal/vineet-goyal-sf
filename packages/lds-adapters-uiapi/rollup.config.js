import { sfdcConfiguration, localConfiguration } from '../../scripts/rollup/rollup.config.adapters';
import path from 'path';
import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';

const { buildOverridesMap, resolveModulesWithOverrides } = require('./scripts/ldsModuleOverride');

function ldsOverrides({ generatedDir, overridesDir }) {
    const overrides = buildOverridesMap({ generatedDir, overridesDir });

    return {
        resolveId(source, importer) {
            return resolveModulesWithOverrides(source, importer, overrides);
        },
    };
}

const sfdcEntry = path.join(__dirname, 'src', 'sfdc.ts');
const entry = path.join(__dirname, 'src', 'main.ts');

const plugins = [
    ldsOverrides({
        generatedDir: path.join(__dirname, 'src', 'generated'),
        overridesDir: path.join(__dirname, 'src', 'overrides'),
    }),
];

const config = {
    cwd: __dirname,
    sfdcEntry,
    entry,
    fileName: 'uiapi-records-service',
    bundleName: 'uiapiRecordsService',
};

const staticFunctions = {
    input: path.join(__dirname, 'src', 'uiapi-static-functions.ts'),
    output: {
        file: path.join(__dirname, 'sfdc', 'uiapi-static-functions.js'),
        format: 'esm',
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
            tsconfigOverride: {
                compilerOptions: {
                    declaration: false,
                },
            },
        }),
    ],
};

export default args => {
    const localConfigurations = localConfiguration(args, config, {
        plugins,
    });

    const sfdcConfigurations = sfdcConfiguration(config, {
        plugins,
        external: ['./uiapi-static-functions', '@salesforce/lds-instrumentation'],
        outputPaths: {
            '@salesforce/lds-instrumentation': 'force/ldsInstrumentation',
        },
    });

    return [...localConfigurations, ...sfdcConfigurations, staticFunctions];
};
