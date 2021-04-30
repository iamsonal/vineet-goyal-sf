import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

const browser = {
    input: './src/main.ts',

    external: [
        '@salesforce/lds-network',
        '@salesforce/lds-instrumentation',
        '@salesforce/lds-default-luvio',
        '@luvio/engine',
    ],

    output: {
        file: 'dist/ldsEngineWebRuntime.js',
        format: 'esm',
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};

export default [browser];
