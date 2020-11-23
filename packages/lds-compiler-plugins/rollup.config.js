import typescript from 'rollup-plugin-typescript2';

export default {
    input: './src/main.ts',

    external: ['@luvio/compiler'],

    output: {
        file: 'dist/plugin.js',
        // @luvio/cli currently supports only cjs imports
        format: 'cjs',
    },

    plugins: [typescript({ clean: true })],
};
