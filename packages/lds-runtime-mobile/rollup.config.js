import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

import * as packageJson from './package.json';
import { buildBanner, buildFooter } from '../../scripts/rollup/rollup-utils';

const banner = buildBanner(false);
const footer = buildFooter(packageJson.version);

const mobile = {
    input: './src/main.ts',

    external: [
        '@salesforce/lds-instrumentation',
        '@salesforce/user/Id',
        'o11y/client',
        'force/ldsAdaptersGraphql',
    ],

    output: {
        file: 'dist/ldsEngineRuntimeMobile.js',
        format: 'esm',
        banner,
        footer,
        paths: {
            '@salesforce/lds-instrumentation': 'force/ldsInstrumentation',
        },
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};

export default [mobile];
