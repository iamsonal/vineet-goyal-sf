import { execSync } from 'child_process';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import replace from 'rollup-plugin-replace';

import * as packageJson from './package.json';

const banner = [
    '/*  *******************************************************************************************',
    ' *  ATTENTION!',
    ' *  THIS IS A GENERATED FILE FROM https://github.com/salesforce/lds',
    ' *  If you would like to contribute to LDS, please follow the steps outlined in the git repo.',
    ' *  Any changes made to this file in p4 will be automatically overwritten.',
    ' *  *******************************************************************************************',
    ' */',
    '/* proxy-compat-disable */',
].join('\n');

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
        'instrumentation/service',
        'logger',
        '@lwc/engine',
        'wire-service',
    ],

    output: {
        file: 'dist/lds.js',
        format: 'esm',
        banner,
        footer,
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

const nativeProxy = {
    ...browser,
    input: './src/ldsNativeProxy/main.ts',
    output: {
        file: 'dist/ldsNativeProxy.js',
        format: 'esm',
        banner,
        footer,
    },
};

const nativeProxyMin = {
    ...nativeProxy,
    output: {
        ...nativeProxy.output,
        file: 'dist/ldsNativeProxy.min.js',
    },
    plugins: [
        ...nativeProxy.plugins,
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

export default [browser, min, nativeProxy, nativeProxyMin, absBridge];
