import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

import * as packageJson from './package.json';
import { buildBanner, buildFooter } from '../../scripts/rollup/rollup-utils';

const banner = buildBanner(true);
const footer = buildFooter(packageJson.version);

const ldsDefaultLuvioConfigs = [
    { formats: ['es', 'umd'], target: 'es2018' },
    { formats: ['umd'], target: 'es5' },
]
    .map(({ formats, target }) =>
        formats.map((format) => ({
            input: 'src/main.ts',
            external: ['@luvio/engine'],
            output: {
                file: `dist/${format}/${target}/main.js`,
                format,
                name: 'lds-default-luvio',
                globals: {
                    '@luvio/engine': 'luvioEngine',
                },
                banner,
                footer,
            },
            plugins: [
                resolve(),
                typescript({
                    clean: true,
                    useTsconfigDeclarationDir: true,
                    tsconfigOverride: {
                        compilerOptions: {
                            composite: true,
                            declarationDir: 'dist/types',
                            target,
                        },
                    },
                }),
            ],
        }))
    )
    .flat();

const coreConfig = {
    input: 'src/sfdc.ts',
    external: ['@salesforce/lds-network-aura'],
    output: {
        file: `sfdc/ldsEngine.js`,
        format: 'es',
        name: 'ldsEngine',
        paths: {
            '@salesforce/lds-network-aura': 'force/ldsNetwork',
        },
        banner,
        footer,
    },
    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};

export default [...ldsDefaultLuvioConfigs, coreConfig];
