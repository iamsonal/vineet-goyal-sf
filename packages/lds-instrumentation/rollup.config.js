import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

import * as packageJson from './package.json';
import { buildBanner, buildFooter } from '../../scripts/rollup/rollup-utils';

const banner = buildBanner(true);
const footer = buildFooter(packageJson.version);

const ldsInstrumentation = {
    input: './src/main.ts',

    external: ['@salesforce/lds-bindings', 'lwc', 'o11y/client'],

    output: {
        file: 'dist/ldsInstrumentation.js',
        format: 'esm',
        paths: {
            '@salesforce/lds-bindings': 'force/ldsBindings',
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

export default [ldsInstrumentation];
