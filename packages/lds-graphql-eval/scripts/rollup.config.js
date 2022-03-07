import resolve from '@rollup/plugin-node-resolve';

export default {
    input: './scripts/cli.js',
    output: {
        file: './scripts/build/cli.mjs',
        format: 'esm',
    },
    plugins: [resolve()],
};
