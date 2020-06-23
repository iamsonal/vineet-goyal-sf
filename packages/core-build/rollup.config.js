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
        'instrumentation/service', // only used by AdsBridge
        '@salesforce/lds-runtime-aura',
        '@salesforce/lds-instrumentation',
        '@salesforce/lds-bindings',
        '@salesforce/lds-adapters-uiapi', //for AdsBridge
        '@salesforce/lds-adapters-uiapi/sfdc',
        '@salesforce/lds-adapters-apex/sfdc',
        '@salesforce/lds-adapters-community-navigation-menu/sfdc',
        '@salesforce/lds-adapters-commerce-catalog/sfdc',
        '@salesforce/lds-adapters-commerce-search/sfdc',
        '@salesforce/lds-adapters-commerce-store-pricing/sfdc',
    ],

    output: {
        file: 'dist/lds.js',
        format: 'esm',
        banner,
        footer,
        paths: {
            '@salesforce/lds-instrumentation': 'force/ldsInstrumentation',
            '@salesforce/lds-runtime-aura': 'force/ldsEngine',
            '@salesforce/lds-bindings': 'force/ldsBindings',
            '@salesforce/lds-adapters-uiapi': 'force/ldsAdaptersUiapi', //for AdsBridge
            '@salesforce/lds-adapters-uiapi/sfdc': 'force/ldsAdaptersUiapi',
            '@salesforce/lds-adapters-apex/sfdc': 'force/ldsAdaptersApex',
            '@salesforce/lds-adapters-community-navigation-menu/sfdc':
                'force/ldsAdaptersCmsDelivery',
            '@salesforce/lds-adapters-commerce-catalog/sfdc': 'force/ldsAdaptersCommerceCatalog',
            '@salesforce/lds-adapters-commerce-search/sfdc': 'force/ldsAdaptersCommerceSearch',
            '@salesforce/lds-adapters-commerce-store-pricing/sfdc':
                'force/ldsAdaptersCommerceStorePricing',
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

const adsBridge = {
    input: './src/lds/ads-bridge.ts',
    output: {
        file: 'dist/ads-bridge.js',
        format: 'esm',
    },
    external: ['instrumentation/service'],
    plugins: [
        ...browser.plugins,
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ],
};

export default [browser, min, adsBridge];
