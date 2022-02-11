import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

const networkAdapter = {
    input: './src/main.ts',

    output: {
        file: 'dist/ldsNetwork.js',
        format: 'esm',
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};

export default [networkAdapter];
