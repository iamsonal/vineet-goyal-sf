import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

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

const adsBridge = {
    input: './src/main.ts',
    external: [
        'instrumentation/service',
        '@salesforce/lds-instrumentation',
        '@salesforce/lds-runtime-aura',
        '@salesforce/lds-adapters-uiapi',
    ],
    output: {
        file: 'dist/adsBridge.js',
        format: 'esm',
        banner,
        paths: {
            '@salesforce/lds-instrumentation': 'force/ldsInstrumentation',
            '@salesforce/lds-runtime-aura': 'force/ldsEngine',
            '@salesforce/lds-adapters-uiapi': 'force/ldsAdaptersUiapi',
        },
    },
    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};

const adsBridgeForPerfTest = {
    input: './src/ads-bridge.ts',
    output: {
        file: 'dist/ads-bridge-perf.js',
        format: 'esm',
    },
    external: ['instrumentation/service'],
    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};

export default [adsBridge, adsBridgeForPerfTest];
