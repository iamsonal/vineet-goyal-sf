#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const fs = require('fs');
const path = require('path');
const camelCase = require('camelcase');

const REPO_ROOT = path.resolve(__dirname, '../../../');

const argv = require('yargs')
    .options('branch', {
        alias: 'b',
        describe: 'which core branch to release the artifact',
    })
    .options('adapter', {
        alias: 'a',
        describe: 'which adapter family package to release the artifact',
    })
    .options('releaseType', {
        alias: 't',
        describe: 'release type "p4" or "jar"',
    })
    .boolean('skip-git-check')
    .describe('skip-git-check', 'skips git branch and status check')
    .boolean('skip-build')
    .describe('skip-build', 'skips building')
    .boolean('skip-clean')
    .describe('skip-clean', 'skips cleaning')
    .boolean('print-commits-only')
    .describe(
        'print-commits-only',
        'print commits since last core release without doing the copy-over'
    )
    .help().argv;

//const RELEASABLE_BRANCHES = ['master'];

function copyArtifacts(repoPath, corePath) {
    console.log(`* Copy artifacts ${repoPath}`);
    fs.copyFileSync(repoPath, corePath);
}

function deployPackage() {
    const isAdapter = argv.adapter !== undefined;
    const repoPathName = isAdapter ? argv.adapter : argv.name;
    const adapterCoreModuleName = camelCase(repoPathName);
    const repoAdapterPackageJsonPath = path.resolve(
        REPO_ROOT,
        `packages/${repoPathName}/package.json`
    );

    const repoAdapterPackageJson = require(repoAdapterPackageJsonPath);

    if (repoAdapterPackageJson.sfdc !== undefined) {
        const publishedAdapterPath = repoAdapterPackageJson.sfdc.path;
        const utilModuleNames = repoAdapterPackageJson.sfdc.addition;
        const fileName = repoAdapterPackageJson.sfdc.publishedFileName
            ? repoAdapterPackageJson.sfdc.publishedFileName
            : `${adapterCoreModuleName}.js`;
        const repoFileName = isAdapter ? 'sfdc/index.js' : repoAdapterPackageJson.main;

        const repoAdapterPath = path.resolve(REPO_ROOT, `packages/${repoPathName}/${repoFileName}`);

        // Copy the artifact into core-build dist
        const ldsBuildModuleParentFolderPath = path.resolve(
            REPO_ROOT,
            `packages/core-build/dist/${publishedAdapterPath}`
        );
        const ldsBuildModuleFilePath = path.resolve(
            REPO_ROOT,
            `packages/core-build/dist/${publishedAdapterPath}/${fileName}`
        );

        fs.mkdirSync(ldsBuildModuleParentFolderPath, { recursive: true });
        copyArtifacts(repoAdapterPath, ldsBuildModuleFilePath);

        // Copy the utils into the same subdir
        if (utilModuleNames !== undefined) {
            utilModuleNames.forEach((utilModuleName) => {
                const repoUtilModulePath = path.resolve(
                    REPO_ROOT,
                    `packages/${argv.adapter}/sfdc/${utilModuleName}.js`
                );

                const ldsBuildModulePath = path.resolve(
                    REPO_ROOT,
                    `packages/core-build/dist/${publishedAdapterPath}/${utilModuleName}.js`
                );

                copyArtifacts(repoUtilModulePath, ldsBuildModulePath);
            });
        }
    } else {
        //throw error? all adapters need the sfdc object in package.json
    }
}

(function () {
    if (argv.adapter !== undefined || argv.name !== undefined) {
        deployPackage();
        return;
    }
})();
