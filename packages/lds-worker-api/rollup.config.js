/* eslint-env node */
import replace from 'rollup-plugin-replace';
import path from 'path';
import resolve from '@rollup/plugin-node-resolve';
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

    external: [
        '@salesforce/lds-instrumentation',
        '@salesforce/lds-adapters-graphql',
        '@salesforce/lds-runtime-mobile',
        'o11y/client',
        'force/ldsAdaptersGraphql', // gql adapter not under lightning/ namespace yet
    ],

    output: [
        {
            ...baseOutput,
            file: platformEsmPath,
            format: 'esm',
            paths: {
                '@salesforce/lds-instrumentation': 'force/ldsInstrumentation',
                '@salesforce/lds-runtime-mobile': 'native/ldsEngineMobile',
                '@salesforce/lds-adapters-graphql': 'force/ldsAdaptersGraphql',
            },
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
                    find: 'force/ldsNetwork',
                    replacement: '@salesforce/lds-network-adapter',
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
                getDuplicateConfiguration_imperative:
                    'unstable_getDuplicateConfiguration_imperative',
                getDuplicates_imperative: 'unstable_getDuplicates_imperative',
                getGlobalActions_imperative: 'unstable_getGlobalActions_imperative',
                getLayout_imperative: 'unstable_getLayout_imperative',
                getLayoutUserState_imperative: 'unstable_getLayoutUserState_imperative',
                getListInfoByName_imperative: 'unstable_getListInfoByName_imperative',
                getListUi_imperative: 'unstable_getListUi_imperative',
                getLookupActions_imperative: 'unstable_getLookupActions_imperative',
                getLookupRecords_imperative: 'unstable_getLookupRecords_imperative',
                getNavItems_imperative: 'unstable_getNavItems_imperative',
                getObjectCreateActions_imperative: 'unstable_getObjectCreateActions_imperative',
                getObjectInfo_imperative: 'unstable_getObjectInfo_imperative',
                getObjectInfos_imperative: 'unstable_getObjectInfos_imperative',
                getPicklistValues_imperative: 'unstable_getPicklistValues_imperative',
                getPicklistValuesByRecordType_imperative:
                    'unstable_getPicklistValuesByRecordType_imperative',
                getQuickActionDefaults_imperative: 'unstable_getQuickActionDefaults_imperative',
                getRecord_imperative: 'unstable_getRecord_imperative',
                getRecordActions_imperative: 'unstable_getRecordActions_imperative',
                getRecordAvatars_imperative: 'unstable_getRecordAvatars_imperative',
                getRecordCreateDefaults_imperative: 'unstable_getRecordCreateDefaults_imperative',
                getRecordEditActions_imperative: 'unstable_getRecordEditActions_imperative',
                getRecordTemplateClone_imperative: 'unstable_getRecordTemplateClone_imperative',
                getRecordTemplateCreate_imperative: 'unstable_getRecordTemplateCreate_imperative',
                getRecordUi_imperative: 'unstable_getRecordUi_imperative',
                getRecords_imperative: 'unstable_getRecords_imperative',
                getRelatedListActions_imperative: 'unstable_getRelatedListActions_imperative',
                getRelatedListCount_imperative: 'unstable_getRelatedListCount_imperative',
                getRelatedListInfo_imperative: 'unstable_getRelatedListInfo_imperative',
                getRelatedListInfoBatch_imperative: 'unstable_getRelatedListInfoBatch_imperative',
                getRelatedListRecordActions_imperative:
                    'unstable_getRelatedListRecordActions_imperative',
                getRelatedListRecords_imperative: 'unstable_getRelatedListRecords_imperative',
                getRelatedListRecordsBatch_imperative:
                    'unstable_getRelatedListRecordsBatch_imperative',
                getRelatedListsActions_imperative: 'unstable_getRelatedListsActions_imperative',
                getRelatedListsCount_imperative: 'unstable_getRelatedListsCount_imperative',
                getRelatedListsInfo_imperative: 'unstable_getRelatedListsInfo_imperative',
            },
        }),
    ],
};

export default [platform, standalone];
