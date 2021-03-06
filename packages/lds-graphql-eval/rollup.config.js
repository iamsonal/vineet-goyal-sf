// @ts-check

import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default {
    input: './src/main.ts',

    external: ['@salesforce/lds-instrumentation'],

    output: {
        file: 'dist/graphql-eval.js',
        format: 'esm',
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};
