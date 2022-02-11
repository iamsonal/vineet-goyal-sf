import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';

export default (_args) => ({
    input: './src/main.ts',
    external: ['@luvio/lwc-luvio', '@salesforce/lds-default-luvio'],
    output: {
        file: './dist/main.js',
        format: 'es',
    },
    plugins: [
        resolve(),
        typescript({
            clean: true,
            useTsconfigDeclarationDir: true,
            tsconfigOverride: {
                compilerOptions: {
                    composite: true,
                    declarationDir: './dist',
                    target: 'es2018',
                    traceResolution: true,
                },
            },
        }),
    ],
});
