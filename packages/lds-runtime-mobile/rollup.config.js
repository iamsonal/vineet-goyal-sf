import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

const browser = {
    input: './src/main.ts',

    external: ['@salesforce/user/Id'],

    output: {
        file: 'dist/ldsEngineRuntimeMobile.js',
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
