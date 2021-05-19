// @ts-check

import { localConfiguration, sfdcConfiguration } from '../../scripts/rollup/rollup.config.adapters';
import path from 'path';

import * as packageJson from './package.json';

const sfdcEntry = path.join(__dirname, 'src', 'sfdc.ts');
const entry = path.join(__dirname, 'src', 'main.ts');

const config = {
    cwd: __dirname,
    sfdcEntry,
    entry,
    fileName: 'graphql-service',
    bundleName: 'graphqlService',
    packageVersion: packageJson.version,
};

export default (args) => [
    ...localConfiguration(args, config),
    ...sfdcConfiguration(config, {
        external: ['@salesforce/lds-adapters-uiapi'],
        outputPaths: {
            '@salesforce/lds-adapters-uiapi': 'force/ldsAdaptersUiapi',
        },
    }),
];
