import { execSync } from 'child_process';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import replace from 'rollup-plugin-replace';

import * as packageJson from './package.json';

const PROXY_COMPAT_DISABLE = '/* proxy-compat-disable */';
const generatedFileBanner = [
    '/*  *******************************************************************************************',
    ' *  ATTENTION!',
    ' *  THIS IS A GENERATED FILE FROM https://github.com/salesforce/lds-lightning-platform',
    ' *  If you would like to contribute to LDS, please follow the steps outlined in the git repo.',
    ' *  Any changes made to this file in p4 will be automatically overwritten.',
    ' *  *******************************************************************************************',
    ' */',
];

const banner = generatedFileBanner.concat([PROXY_COMPAT_DISABLE]).join('\n');

let hash;
try {
    hash = execSync('git rev-parse --short HEAD')
        .toString()
        .trim();
} catch (e) {
    //ignore
    hash = '';
}
const footer = `// version: ${packageJson.version}-${hash}`;

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
