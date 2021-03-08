import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

import * as packageJson from './package.json';
import { buildBanner, buildFooter } from '../../scripts/rollup/rollup-utils';

const banner = buildBanner(true);
const footer = buildFooter(packageJson.version);

export default {
    input: './src/main.ts',

    external: ['lwc', '@salesforce/lds-instrumentation', '@salesforce/lds-runtime-web'],

    output: {
        file: 'dist/ldsBindings.js',
        format: 'esm',
        banner,
        footer,
        paths: {
            '@salesforce/lds-instrumentation': 'force/ldsInstrumentation',
            '@salesforce/lds-runtime-web': 'force/ldsEngine',
        },
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};
