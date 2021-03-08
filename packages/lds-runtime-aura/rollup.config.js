import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import replace from 'rollup-plugin-replace';

import * as packageJson from './package.json';
import { buildBanner, buildFooter, readGitHash } from '../../scripts/rollup/rollup-utils';

const banner = buildBanner(true);
const footer = buildFooter(packageJson.version);
const hash = readGitHash();

const ldsEngine = {
    input: './src/main.ts',

    external: [
        '@salesforce/lds-aura-storage',
        '@salesforce/lds-network',
        '@salesforce/lds-instrumentation',
    ],

    output: {
        file: 'dist/ldsEngine.js',
        format: 'esm',
        banner,
        footer,
        paths: {
            '@salesforce/lds-network': 'force/ldsNetwork',
            '@salesforce/lds-aura-storage': 'force/ldsStorage',
            '@salesforce/lds-instrumentation': 'force/ldsInstrumentation',
        },
    },
    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
        replace({
            'process.env.VERSION': JSON.stringify(hash),
        }),
    ],
};

export default [ldsEngine];
