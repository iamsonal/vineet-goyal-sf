/* eslint-env node */
import replace from 'rollup-plugin-replace';
import path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import typescript from 'rollup-plugin-typescript2';
import wildcardExternal from '@oat-sa/rollup-plugin-wildcard-external';

import * as packageJson from './package.json';
import { buildBanner, buildFooter } from '../../scripts/rollup/rollup-utils';

const dist = path.resolve(__dirname, `./dist`);
const platformDir = path.resolve(dist, './sfdc');
const standaloneDir = path.resolve(dist, './standalone');
const platformEsmPath = path.resolve(platformDir, `./es/ldsWorkerApi.js`);
const standaloneEsmPath = path.resolve(standaloneDir, `./es/lds-worker-api.js`);
const standaloneUmdPath = path.resolve(standaloneDir, `./umd/lds-worker-api.js`);

const environment = process.env.build || 'development';

const banner = buildBanner(false);
const footer = buildFooter(packageJson.version);

const baseOutput = { banner, footer };

const platform = {
    input: 'src/main.ts',

    external: ['native/ldsEngineMobile', 'force/ldsAdaptersGraphql'],

    output: [
        {
            ...baseOutput,
            file: platformEsmPath,
            format: 'esm',
        },
    ],

    plugins: [
        wildcardExternal(['lightning/*']),
        typescript(),
        resolve({ modulesOnly: true }),
        replace({
            preventAssignment: true,
            values: {
                'process.env.NODE_ENV': JSON.stringify(environment),
                'process.env.ENVIRONMENT': JSON.stringify(environment),
            },
        }),
    ],
};

const standalone = {
    input: 'src/main.ts',
    output: [
        {
            ...baseOutput,
            file: standaloneEsmPath,
            format: 'esm',
        },
        {
            ...baseOutput,
            file: standaloneUmdPath,
            format: 'umd',
            name: 'ldsWorkerApi',
        },
    ],
    plugins: [
        alias({
            resolve: ['.js', '.ts'],
            entries: [
                {
                    find: /^lightning\/ui(.*)Api$/,
                    replacement: '@salesforce/lds-adapters-uiapi/sfdc',
                },
                {
                    find: /^lightning\/unstable_ui(.*)Api$/,
                    replacement: '@salesforce/lds-adapters-uiapi/sfdc',
                },
                {
                    find: 'lwc',
                    replacement: require.resolve('./src/standalone-stubs/unwrap.ts'),
                },
                {
                    find: 'force/ldsBindings',
                    replacement: '@salesforce/lds-bindings',
                },
                {
                    find: 'native/ldsEngineMobile',
                    replacement: '@salesforce/lds-runtime-mobile',
                },
                {
                    find: 'force/ldsEngine',
                    replacement: '@salesforce/lds-runtime-mobile',
                },
                {
                    find: 'force/ldsAdaptersGraphql',
                    replacement: '@salesforce/lds-adapters-graphql/sfdc',
                },
                {
                    find: 'force/ldsAdaptersUiapi',
                    replacement: '@salesforce/lds-adapters-uiapi/sfdc',
                },
                {
                    find: 'o11y/client',
                    replacement: require.resolve('./src/standalone-stubs/o11y.ts'),
                },
                {
                    find: 'force/ldsInstrumentation',
                    replacement: require.resolve('./src/standalone-stubs/instrumentation.ts'),
                },
                {
                    find: '@salesforce/user/Id',
                    replacement: require.resolve('./src/standalone-stubs/salesforce-user-id.ts'),
                },
            ],
        }),
        typescript(),
        resolve({ modulesOnly: true }),
        replace({
            preventAssignment: true,
            values: {
                'process.env.NODE_ENV': JSON.stringify(environment),
                'process.env.ENVIRONMENT': JSON.stringify(environment),
            },
        }),
    ],
};

export default [platform, standalone];
