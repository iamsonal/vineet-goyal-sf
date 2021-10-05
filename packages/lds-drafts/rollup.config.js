import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default {
    input: './src/main.ts',

    output: {
        file: 'dist/ldsDrafts.js',
        format: 'esm',
        sourcemap: 'inline',
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};
