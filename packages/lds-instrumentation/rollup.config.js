import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

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

const ldsInstrumentation = {
    input: './src/main.ts',

    external: ['lwc', 'instrumentation/service'],

    output: {
        file: 'dist/ldsInstrumentation.js',
        format: 'esm',
        banner,
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};

export default [ldsInstrumentation];
