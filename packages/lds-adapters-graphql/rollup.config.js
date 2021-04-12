// @ts-check

import { rollup } from '../../scripts/rollup/rollup.config.adapters';
import path from 'path';

import * as packageJson from './package.json';

const sfdcEntry = path.join(__dirname, 'src', 'sfdc.ts');
const entry = path.join(__dirname, 'src', 'main.ts');

export default rollup({
    cwd: __dirname,
    sfdcEntry,
    entry,
    fileName: 'graphql-service',
    bundleName: 'graphqlService',
    packageVersion: packageJson.version,
});
