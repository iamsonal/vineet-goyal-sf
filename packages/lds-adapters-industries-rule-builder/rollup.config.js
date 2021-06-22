// @ts-check

import { rollup } from '../../scripts/rollup/rollup.config.adapters';
import path from 'path';

import * as packageJson from './package.json';

const sfdcEntry = path.join(__dirname, 'src', 'generated', 'artifacts', 'sfdc.ts');
const entry = path.join(__dirname, 'src', 'generated', 'artifacts', 'main.ts');

export default rollup({
    cwd: __dirname,
    sfdcEntry,
    entry,
    fileName: 'industries-rule-builder',
    bundleName: 'industriesRuleBuilder',
    packageVersion: packageJson.version,
});