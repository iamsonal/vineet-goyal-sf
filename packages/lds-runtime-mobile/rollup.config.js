import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

const browser = {
    input: './src/main.ts',

    output: {
        file: 'dist/ldsEngineMobileRuntime.js',
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
