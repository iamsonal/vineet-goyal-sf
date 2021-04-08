import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

import * as packageJson from './package.json';
import { buildFooter } from '../../scripts/rollup/rollup-utils';

const footer = buildFooter(packageJson.version);

const ldsGraphqlParserRollupConfig = {
    input: './src/main.ts',
    output: {
        file: 'dist/ldsGraphqlParser.js',
        format: 'esm',
        footer,
    },

    plugins: [
        resolve(),
        typescript({
            clean: true,
        }),
    ],
};

export default ldsGraphqlParserRollupConfig;
