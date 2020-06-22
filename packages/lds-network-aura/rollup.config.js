import { execSync } from 'child_process';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import replace from 'rollup-plugin-replace';

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

const networkAdapter = {
    input: './src/main.ts',

    external: ['aura', '@salesforce/lds-aura-storage', '@salesforce/lds-instrumentation'],

    output: {
        file: 'dist/ldsNetwork.js',
        format: 'esm',
        banner,
        paths: {
            '@salesforce/lds-instrumentation': 'force/ldsInstrumentation',
            '@salesforce/lds-aura-storage': 'force/ldsStorage',
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

export default [networkAdapter];
