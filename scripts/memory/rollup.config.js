import resolve from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';

export default {
    input: './scripts/memory/test.js',
    output: {
        file: './scripts/memory/build/test.js',
        format: 'iife',
    },
    plugins: [
        resolve(),
        cjs(),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ],
};
