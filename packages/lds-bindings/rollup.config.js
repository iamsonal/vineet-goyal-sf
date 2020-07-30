import path from 'path';
import fs from 'fs';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

const noLwcOutputDir = path.join(__dirname, 'no-lwc');

const PROXY_COMPAT_DISABLE = '/* proxy-compat-disable */';
const generatedFileBanner = [
    '/*  *******************************************************************************************',
    ' *  ATTENTION!',
    ' *  THIS IS A GENERATED FILE FROM https://github.com/salesforce/lds-lightning-platform',
    ' *  If you would like to contribute to LDS, please follow the steps outlined in the git repo.',
    ' *  Any changes made to this file in p4 will be automatically overwritten.',
    ' *  *******************************************************************************************',
    ' */',
];

const banner = generatedFileBanner.concat([PROXY_COMPAT_DISABLE]).join('\n');

const bindings = {
    input: './src/main.ts',

    external: ['lwc', '@salesforce/lds-instrumentation', '@salesforce/lds-runtime-web'],

    output: {
        file: 'dist/ldsBindings.js',
        format: 'esm',
        banner,
        paths: {
            '@salesforce/lds-instrumentation': 'force/ldsInstrumentation',
            '@salesforce/lds-runtime-web': 'force/ldsEngine',
        },
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};

const bindingsNoLWC = {
    ...bindings,
    input: './src/main-no-lwc.ts',
    output: {
        ...bindings.output,
        file: path.join(noLwcOutputDir, 'index.js'),
        plugins: [
            {
                writeBundle() {
                    fs.writeFileSync(
                        path.join(noLwcOutputDir, 'index.d.ts'),
                        `export * from './main-no-lwc';`
                    );
                },
            },
        ],
    },
    // set tree-shake to ignore side effects of unused external modules (lwc in
    // this case)
    treeshake: { moduleSideEffects: 'no-external' },
};

export default [bindings, bindingsNoLWC];
