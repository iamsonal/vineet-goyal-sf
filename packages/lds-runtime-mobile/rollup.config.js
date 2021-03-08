import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

import * as packageJson from './package.json';
import { buildBanner, buildFooter } from '../../scripts/rollup/rollup-utils';

const banner = buildBanner(false);
const footer = buildFooter(packageJson.version);

const mobile = {
    input: './src/main.ts',

    external: ['@salesforce/user/Id'],

    output: {
        file: 'dist/ldsEngineRuntimeMobile.js',
        format: 'esm',
        banner,
        footer,
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};

export default [mobile];
