import { execSync } from 'child_process';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import replace from 'rollup-plugin-replace';

import * as packageJson from './package.json';

const PROXY_COMPAT_DISABLE = '/* proxy-compat-disable */';
const generatedFileBanner = [
    '/*  *******************************************************************************************',
    ' *  ATTENTION!',
    ' *  THIS IS A GENERATED FILE FROM https://github.com/salesforce/lds',
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

const browser = {
    input: './src/main.ts',

    external: [
        'aura-storage',
        'aura',
        'force/shared',
        'lds-static-functions',
        'instrumentation/service',
        'logger',
        'lwc',
        'wire-service',
    ],

    output: {
        file: 'dist/lds.js',
        format: 'esm',
        banner,
        footer,
        paths: {
            'lds-static-functions': './lds-static-functions',
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

const ldsStaticFunctionsBrowser = {
    input: './src/lds/lds-static-functions.ts',
    output: {
        file: 'dist/lds-static-functions.js',
        format: 'esm',
        banner: generatedFileBanner.join('\n'),
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};

const min = {
    ...browser,
    output: {
        ...browser.output,
        file: 'dist/lds.min.js',
    },
    plugins: [
        ...browser.plugins,
        terser({
            output: {
                comments: /(ATTENTION!|version:)/,
            },
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ],
};

const webview = {
    ...browser,
    input: './src/lds-webview/main.ts',
    output: {
        ...browser.output,
        file: 'dist/ldsNativeProxy.js',
    },
};

const webviewMin = {
    ...webview,
    output: {
        ...webview.output,
        file: 'dist/ldsNativeProxy.min.js',
    },
    plugins: [
        ...webview.plugins,
        terser({
            output: {
                comments: /(ATTENTION!|version:)/,
            },
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ],
};

const ldsMobile = {
    ...browser,
    input: './src/lds-mobile/main.ts',
    output: {
        file: 'dist/lds-mobile.js',
        name: 'ldsMobile',
        format: 'umd',
        banner,
        footer,
    },
    plugins: [
        ...browser.plugins,
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ],
};

const ldsMobileMin = {
    ...ldsMobile,
    output: {
        ...ldsMobile.output,
        file: 'dist/lds-mobile.min.js',
    },
    plugins: [
        ...ldsMobile.plugins,
        terser({
            output: {
                comments: /(ATTENTION!|version:)/,
            },
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ],
};

const absBridge = {
    input: './src/lds/ads-bridge.ts',
    output: {
        file: 'dist/ads-bridge.js',
        format: 'esm',
    },
    plugins: [
        ...browser.plugins,
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ],
};

export default [
    browser,
    min,
    webview,
    webviewMin,
    ldsMobile,
    ldsMobileMin,
    absBridge,
    ldsStaticFunctionsBrowser,
];
