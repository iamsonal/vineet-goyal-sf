import { localConfiguration, sfdcConfiguration } from '../../scripts/rollup/rollup.config.adapters';
import path from 'path';
import typescript from 'rollup-plugin-typescript2';

const sfdcEntry = path.join(__dirname, 'src', 'sfdc.ts');
const entry = path.join(__dirname, 'src', 'main.ts');

const config = {
    cwd: __dirname,
    sfdcEntry,
    entry,
    fileName: 'apex-service',
    bundleName: 'apexService',
};

/**
 * @param {{
 *  configTarget: string,
 *  configFormat: string,
 * }} args
 */
export default function(args) {
    const sfdcConfigurations = sfdcConfiguration(config, {
        external: ['./lds-apex-static-utils', '@salesforce/lds-instrumentation'],
        outputPaths: {
            '@salesforce/lds-instrumentation': 'force/ldsInstrumentation',
        },
    });
    const localConfigurations = localConfiguration(args, config);

    return [
        ...localConfigurations,
        ...sfdcConfigurations,
        {
            input: path.join(__dirname, 'src', 'lds-apex-static-utils.ts'),
            output: {
                file: path.join(__dirname, 'sfdc', 'lds-apex-static-utils.js'),
                format: 'es',
            },
            plugins: [
                typescript({
                    clean: false,
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
