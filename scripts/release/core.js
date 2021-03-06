#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const camelCase = require('camelcase');
const { execSync } = require('child_process');

const REPO_ROOT_PARENT = path.resolve(__dirname, '../../..');
const RELATIVE_LUVIO_REPO_ROOT = path.resolve(REPO_ROOT_PARENT, 'luvio');
const REPO_ROOT = path.resolve(__dirname, '../../');

const REPO_LDS_BINDINGS_PATH = path.resolve(REPO_ROOT, 'packages/lds-bindings/dist/ldsBindings.js');
const REPO_LDS_ENGINE_RUNTIME_AURA_PATH = path.resolve(
    REPO_ROOT,
    'packages/lds-default-luvio/sfdc/ldsEngine.js'
);
const REPO_LDS_ENGINE_CREATOR_RUNTIME_AURA_PATH = path.resolve(
    REPO_ROOT,
    'packages/lds-runtime-aura/dist/ldsEngineCreator.js'
);
const REPO_LDS_ENGINE_RUNTIME_MOBILE_PATH = path.resolve(
    REPO_ROOT,
    'packages/lds-runtime-mobile/dist/ldsEngineRuntimeMobile.js'
);
const REPO_LDS_WORKER_API_PATH = path.resolve(
    REPO_ROOT,
    'packages/lds-worker-api/dist/sfdc/es/ldsWorkerApi.js'
);
const REPO_LDS_NETWORK_PATH = path.resolve(
    REPO_ROOT,
    'packages/lds-network-aura/dist/ldsNetwork.js'
);
const REPO_LDS_STORAGE_PATH = path.resolve(
    REPO_ROOT,
    'packages/lds-aura-storage/dist/ldsStorage.js'
);
const REPO_LDS_INSTRUMENTATION_PATH = path.resolve(
    REPO_ROOT,
    'packages/lds-instrumentation/dist/ldsInstrumentation.js'
);
const REPO_ADS_BRIDGE_PATH = path.resolve(REPO_ROOT, 'packages/lds-ads-bridge/dist/adsBridge.js');
const REPO_LDS_ENVIRONMENT_SETTINGS_PATH = path.resolve(
    REPO_ROOT,
    'packages/lds-environment-settings/dist/ldsEnvironmentSettings.js'
);

// The BLT_HOME environment variable is set when sourcing the "env.sh" script contained in the blt
// folder. Otherwise it gets set to the default BLT install location.
const BLT_HOME = process.env.BLT_HOME || path.resolve(os.homedir(), 'blt');

const argv = require('yargs')
    .options('branch', {
        alias: 'b',
        describe: 'which core branch to release the artifact',
    })
    .options('adapter', {
        alias: 'a',
        describe: 'which adapter family package to release the artifact',
    })
    .boolean('skip-git-check')
    .describe('skip-git-check', 'skips git branch and status check')
    .boolean('skip-build')
    .describe('skip-build', 'skips installing and building (and cleaning)')
    .boolean('skip-clean')
    .describe('skip-clean', 'skips cleaning')
    .boolean('print-commits-only')
    .describe(
        'print-commits-only',
        'print commits since last core release without doing the copy-over'
    )
    .boolean('auto-checkout')
    .describe('auto-checkout', 'automatically runs `p4 edit` on Core files before building')
    .help().argv;

const MAIN_BRANCH = 'main';

const CORE_BRANCH = argv.branch || MAIN_BRANCH;

const CORE_LDS_ENGINE_RUNTIME_AURA_PATH = path.resolve(
    BLT_HOME,
    'app',
    CORE_BRANCH,
    'core/ui-force-components/modules/force/ldsEngine/ldsEngine.js'
);

const CORE_LDS_ENGINE_CREATOR_RUNTIME_AURA_PATH = path.resolve(
    BLT_HOME,
    'app',
    CORE_BRANCH,
    'core/ui-force-components/modules/force/ldsEngineCreator/ldsEngineCreator.js'
);

const CORE_LDS_ENGINE_RUNTIME_MOBILE_PATH = path.resolve(
    BLT_HOME,
    'app',
    CORE_BRANCH,
    'core/ui-bridge-components/modules/native/ldsEngineMobile/ldsEngineMobile.js'
);

const CORE_LDS_WORKER_API_PATH = path.resolve(
    BLT_HOME,
    'app',
    CORE_BRANCH,
    'core/ui-bridge-components/modules/native/ldsWorkerApi/ldsWorkerApi.js'
);

const CORE_LDS_NETWORK_PATH = path.resolve(
    BLT_HOME,
    'app',
    CORE_BRANCH,
    'core/ui-force-components/modules/force/ldsNetwork/ldsNetwork.js'
);

const CORE_LDS_STORAGE_PATH = path.resolve(
    BLT_HOME,
    'app',
    CORE_BRANCH,
    'core/ui-force-components/modules/force/ldsStorage/ldsStorage.js'
);

const CORE_LDS_INSTRUMENTATION_PATH = path.resolve(
    BLT_HOME,
    'app',
    CORE_BRANCH,
    'core/ui-force-components/modules/force/ldsInstrumentation/ldsInstrumentation.js'
);

const CORE_LDS_BINDINGS_PATH = path.resolve(
    BLT_HOME,
    'app',
    CORE_BRANCH,
    'core/ui-force-components/modules/force/ldsBindings/ldsBindings.js'
);

const CORE_ADS_BRIDGE_PATH = path.resolve(
    BLT_HOME,
    'app',
    CORE_BRANCH,
    'core/ui-force-components/modules/force/adsBridge/adsBridge.js'
);

const CORE_LDS_ENVIRONMENT_SETTINGS_PATH = path.resolve(
    BLT_HOME,
    'app',
    CORE_BRANCH,
    'core/ui-force-components/modules/force/ldsEnvironmentSettings/ldsEnvironmentSettings.js'
);

const RELEASABLE_BRANCHES = ['main'];

function error(msg, code = 1) {
    console.error(`[ERROR]: ${msg}`);
    process.exit(code);
}

function checkCore(corePath) {
    console.log(`* Check ${corePath}`);

    if (!fs.existsSync(BLT_HOME)) {
        error(
            `No BLT installation found at ${BLT_HOME}. Make sure to run "source ./env.sh" inside your local installation of BLT.`
        );
    }

    const coreBranchPath = path.resolve(BLT_HOME, 'app', CORE_BRANCH);
    if (!fs.existsSync(coreBranchPath)) {
        error(`Invalid core branch at ${coreBranchPath}.`);
    }

    if (!fs.existsSync(corePath)) {
        if (argv['auto-checkout']) {
            execSync(`p4 add ${corePath}`);
            execSync(`mkdir -p "$(dirname "${corePath}")" && touch "${corePath}"`);
        } else {
            error(
                `File doesn't exist at ${corePath}. Make sure that the branch you want to release into is enabled.`
            );
        }
    } else if (argv['auto-checkout']) {
        execSync(`p4 edit ${corePath}`);
    }

    try {
        fs.accessSync(corePath, fs.constants.W_OK);
    } catch {
        error(`File is not writable. Make sure to run "p4 edit ${corePath}".`);
    }
}

function checkGitStatus() {
    console.log('* Check git status');

    const currentBranch = execSync(`git branch | grep \\* | cut -d ' ' -f2`).toString().trim();

    if (!RELEASABLE_BRANCHES.includes(currentBranch)) {
        error(
            `The current branch is not releasable. (current: ${currentBranch}, releasable: [${RELEASABLE_BRANCHES.join(
                ', '
            )}])`
        );
    }

    try {
        execSync('git diff-index --quiet HEAD');
    } catch {
        error('The repository contains uncommitted changes.');
    }
}

function clean() {
    console.log('* Clean');
    execSync('yarn clean', {
        cwd: REPO_ROOT,
        stdio: 'ignore',
    });
}

function install() {
    console.log('* Install');
    execSync('yarn', {
        cwd: REPO_ROOT,
        stdio: 'ignore',
    });
}

function build() {
    console.log('* Build');
    execSync('yarn build', {
        cwd: REPO_ROOT,
        stdio: 'ignore',
    });
}

function installAndBuild() {
    install();
    build();
}

function printCommits(corePath) {
    if (fs.existsSync(RELATIVE_LUVIO_REPO_ROOT)) {
        console.log('* Include LDS engine commits:');
        let hash;
        const version = execSync(`grep '// engine version: ' ${corePath}`)
            .toString()
            .trim()
            .split('-');

        // Sample Main branch version: // engine version: 0.19.4-13cdff7d
        // Sample Patch branch version: // engine version: 0.19.4-230.2-758e836
        // When we split the branch at the end of the release, for the first patch release we will get the main branch version
        if (CORE_BRANCH.endsWith('/patch') && version[2]) {
            hash = version[2];
        } else {
            hash = version[1];
        }

        const commits = execSync(
            `cd ${RELATIVE_LUVIO_REPO_ROOT}; git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --date=relative ${hash}...HEAD`
        )
            .toString()
            .trim();

        console.log(commits);
    }

    console.log('* Include commits:');
    let hash;
    const version = execSync(`tail -n 1 ${corePath}`).toString().trim().split('-');

    if (CORE_BRANCH.endsWith('/patch') && version[2]) {
        hash = version[2];
    } else {
        hash = version[1];
    }

    const commits = execSync(
        `git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --date=relative ${hash}...HEAD`
    )
        .toString()
        .trim();

    console.log(commits);
}

function copyArtifacts(repoPath, corePath) {
    console.log(`* Copy artifacts ${repoPath}`);
    fs.copyFileSync(repoPath, corePath);

    // todo: uncomment when we migrate existing adapters to the "new" adapter package model
    //console.log('* Reverting if unchanged');
    //execSync(`p4 revert -a ${corePath}`);
}

function deployAdapterPackage() {
    const adapterCoreModuleName = camelCase(argv.adapter);
    const coreAdapterPath = path.resolve(
        BLT_HOME,
        'app',
        CORE_BRANCH,
        `core/ui-force-components/modules/force/${adapterCoreModuleName}/${adapterCoreModuleName}.js`
    );
    checkCore(coreAdapterPath);

    const repoAdapterPath = path.resolve(REPO_ROOT, `packages/${argv.adapter}/sfdc/index.js`);
    copyArtifacts(repoAdapterPath, coreAdapterPath);

    const repoAdapterPackageJsonPath = path.resolve(
        REPO_ROOT,
        `packages/${argv.adapter}/package.json`
    );
    const repoAdapterPackageJson = require(repoAdapterPackageJsonPath);
    if (
        repoAdapterPackageJson.sfdc !== undefined &&
        repoAdapterPackageJson.sfdc.addition !== undefined
    ) {
        const utilModuleNames = repoAdapterPackageJson.sfdc.addition;
        utilModuleNames.forEach((utilModuleName) => {
            const coreUtilModulePath = path.resolve(
                BLT_HOME,
                'app',
                CORE_BRANCH,
                `core/ui-force-components/modules/force/${adapterCoreModuleName}/${utilModuleName}.js`
            );
            checkCore(coreUtilModulePath);

            const repoUtilModulePath = path.resolve(
                REPO_ROOT,
                `packages/${argv.adapter}/sfdc/${utilModuleName}.js`
            );
            copyArtifacts(repoUtilModulePath, coreUtilModulePath);
        });
    }
}

(function () {
    if (argv.adapter !== undefined) {
        deployAdapterPackage();
        return;
    }

    console.log('Releasing to:');
    console.log(`- blt home: ${BLT_HOME}`);
    console.log(`- core branch: ${CORE_BRANCH}`);
    console.log();

    if (argv['print-commits-only']) {
        printCommits(CORE_LDS_ENGINE_RUNTIME_AURA_PATH);
        return;
    }

    checkCore(CORE_LDS_ENGINE_RUNTIME_AURA_PATH);
    checkCore(CORE_LDS_ENGINE_CREATOR_RUNTIME_AURA_PATH);
    checkCore(CORE_LDS_ENGINE_RUNTIME_MOBILE_PATH);
    checkCore(CORE_LDS_WORKER_API_PATH);
    checkCore(CORE_LDS_NETWORK_PATH);
    checkCore(CORE_LDS_STORAGE_PATH);
    checkCore(CORE_LDS_INSTRUMENTATION_PATH);
    checkCore(CORE_LDS_BINDINGS_PATH);
    checkCore(CORE_ADS_BRIDGE_PATH);
    checkCore(CORE_LDS_ENVIRONMENT_SETTINGS_PATH);

    if (!argv['skip-git-check']) {
        checkGitStatus();
    }

    if (!argv['skip-clean'] && !argv['skip-build']) {
        clean();
    }

    // Implicitly install and then build
    if (!argv['skip-build']) {
        installAndBuild();
    }

    try {
        printCommits(CORE_LDS_ENGINE_RUNTIME_AURA_PATH);
    } catch (e) {
        // log it but do not fail the whole process
        console.log(e);
    }

    copyArtifacts(REPO_LDS_ENGINE_RUNTIME_AURA_PATH, CORE_LDS_ENGINE_RUNTIME_AURA_PATH);
    copyArtifacts(
        REPO_LDS_ENGINE_CREATOR_RUNTIME_AURA_PATH,
        CORE_LDS_ENGINE_CREATOR_RUNTIME_AURA_PATH
    );
    copyArtifacts(REPO_LDS_ENGINE_RUNTIME_MOBILE_PATH, CORE_LDS_ENGINE_RUNTIME_MOBILE_PATH);
    copyArtifacts(REPO_LDS_WORKER_API_PATH, CORE_LDS_WORKER_API_PATH);
    copyArtifacts(REPO_LDS_NETWORK_PATH, CORE_LDS_NETWORK_PATH);
    copyArtifacts(REPO_LDS_STORAGE_PATH, CORE_LDS_STORAGE_PATH);
    copyArtifacts(REPO_LDS_INSTRUMENTATION_PATH, CORE_LDS_INSTRUMENTATION_PATH);
    copyArtifacts(REPO_LDS_BINDINGS_PATH, CORE_LDS_BINDINGS_PATH);
    copyArtifacts(REPO_ADS_BRIDGE_PATH, CORE_ADS_BRIDGE_PATH);
    copyArtifacts(REPO_LDS_ENVIRONMENT_SETTINGS_PATH, CORE_LDS_ENVIRONMENT_SETTINGS_PATH);
})();
