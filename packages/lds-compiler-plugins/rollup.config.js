import typescript from 'rollup-plugin-typescript2';

export default {
    input: './src/main.ts',

    external: ['@ldsjs/compiler'],

    output: {
        file: 'dist/plugin.js',
        // @ldsjs/cli currently supports only cjs imports
        format: 'cjs',
    },

    plugins: [typescript({ clean: true })],
};
