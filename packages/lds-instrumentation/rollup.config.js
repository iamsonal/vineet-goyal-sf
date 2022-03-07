import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

import * as packageJson from './package.json';
import { buildBanner, buildFooter } from '../../scripts/rollup/rollup-utils';

const banner = buildBanner(true);
const footer = buildFooter(packageJson.version);

const ldsInstrumentation = {
    input: './src/main.ts',

    external: [
        '@salesforce/lds-adapters-uiapi',
        '@salesforce/lds-bindings',
        '@salesforce/lds-network-adapter',
        /* o11y modules on core have the same name as their npm counterpart */
        'o11y/client',
        'o11y_schema/sf_lds',
    ],

    output: {
        file: 'dist/ldsInstrumentation.js',
        format: 'esm',
        paths: {
            '@salesforce/lds-adapters-uiapi': 'force/ldsAdaptersUiapi',
            '@salesforce/lds-bindings': 'force/ldsBindings',
            '@salesforce/lds-network-adapter': 'force/ldsNetwork',
        },
        banner,
        footer,
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};

export default [ldsInstrumentation];
