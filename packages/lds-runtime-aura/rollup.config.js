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
        '@luvio/engine',
        '@salesforce/lds-aura-storage',
        '@salesforce/lds-default-luvio',
        '@salesforce/lds-instrumentation',
        '@salesforce/lds-network-aura',
        '@salesforce/lds-adapters-uiapi',
        '@salesforce/gate/lds.useNewTrackedFieldBehavior',
    ],

    output: {
        file: 'dist/ldsEngineCreator.js',
        format: 'esm',
        banner,
        footer,
        paths: {
            '@luvio/engine': 'force/ldsEngine',
            '@salesforce/lds-aura-storage': 'force/ldsStorage',
            '@salesforce/lds-default-luvio': 'force/ldsEngine',
            '@salesforce/lds-instrumentation': 'force/ldsInstrumentation',
            '@salesforce/lds-network-aura': 'force/ldsNetwork',
            '@salesforce/lds-adapters-uiapi': 'force/ldsAdaptersUiapi',
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
