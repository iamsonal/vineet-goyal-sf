import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import replace from 'rollup-plugin-replace';

import * as packageJson from './package.json';
import { buildBanner, buildFooter, readGitHash } from '../../scripts/rollup/rollup-utils';

const banner = buildBanner(true);
const footer = buildFooter(packageJson.version);
const hash = readGitHash();

const networkAdapter = {
    input: './src/main.ts',

    external: [
        'aura',
        'instrumentation/service',
        '@salesforce/lds-aura-storage',
        '@salesforce/lds-instrumentation',
        '@salesforce/lds-environment-settings',
    ],

    output: {
        file: 'dist/ldsNetwork.js',
        format: 'esm',
        banner,
        footer,
        paths: {
            '@salesforce/lds-instrumentation': 'force/ldsInstrumentation',
            '@salesforce/lds-aura-storage': 'force/ldsStorage',
            '@salesforce/lds-environment-settings': 'force/ldsEnvironmentSettings',
        },
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
        replace({
            preventAssignment: true,
            values: {
                'process.env.VERSION': JSON.stringify(hash),
            },
        }),
    ],
};

export default [networkAdapter];
