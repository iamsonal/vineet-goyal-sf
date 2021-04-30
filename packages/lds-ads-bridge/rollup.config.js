import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

import * as packageJson from './package.json';
import { buildBanner, buildFooter } from '../../scripts/rollup/rollup-utils';

const banner = buildBanner(true);
const footer = buildFooter(packageJson.version);

const adsBridge = {
    input: './src/main.ts',
    external: [
        'instrumentation/service',
        '@salesforce/lds-instrumentation',
        '@salesforce/lds-adapters-uiapi',
        '@salesforce/lds-default-luvio',
    ],
    output: {
        file: 'dist/adsBridge.js',
        format: 'esm',
        banner,
        footer,
        paths: {
            '@salesforce/lds-instrumentation': 'force/ldsInstrumentation',
            '@salesforce/lds-default-luvio': 'force/ldsEngine',
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
