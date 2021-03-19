import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

import * as packageJson from './package.json';
import { buildBanner, buildFooter } from '../../scripts/rollup/rollup-utils';

const banner = buildBanner(true);
const footer = buildFooter(packageJson.version);

export default [
    { formats: ['es', 'umd'], target: 'es2018' },
    { formats: ['umd'], target: 'es5' },
]
    .map(({ formats, target }) =>
        formats.map(format => ({
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
