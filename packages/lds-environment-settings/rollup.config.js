import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

import * as packageJson from './package.json';
import { buildBanner, buildFooter } from '../../scripts/rollup/rollup-utils';

const banner = buildBanner(true);
const footer = buildFooter(packageJson.version);

const ldsEnvironmentSettings = {
    input: './src/main.ts',
    output: {
        file: 'dist/ldsEnvironmentSettings.js',
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

export default ldsEnvironmentSettings;
