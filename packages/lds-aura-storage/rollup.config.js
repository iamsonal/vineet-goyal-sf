import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import replace from 'rollup-plugin-replace';

import * as packageJson from './package.json';
import { buildBanner, buildFooter, readGitHash } from '../../scripts/rollup/rollup-utils';

const banner = buildBanner(true);
const footer = buildFooter(packageJson.version);
const hash = readGitHash();

const ldsStorage = {
    input: './src/main.ts',

    external: ['aura-storage'],

    output: {
        file: 'dist/ldsStorage.js',
        format: 'esm',
        banner,
        footer,
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
        replace({
            'process.env.VERSION': JSON.stringify(hash),
        }),
    ],
};

export default [ldsStorage];
