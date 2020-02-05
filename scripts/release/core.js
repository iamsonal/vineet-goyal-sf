#!/usr/bin/env node
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../../');
const REPO_LDS_PATH = path.resolve(REPO_ROOT, 'dist/lds.js');
const REPO_LDS_NATIVE_PROXY_PATH = path.resolve(REPO_ROOT, 'dist/ldsNativeProxy.js');
const REPO_LDS_STATIC_FUNCTIONS_PATH = path.resolve(
    REPO_ROOT,
    'packages/core-build/dist/lds-static-functions.js'
);

// The BLT_HOME environment variable is set when sourcing the "env.sh" script contained in the blt
// folder. Otherwise it gets set to the default BLT install location.
const BLT_HOME = process.env.BLT_HOME || path.resolve(os.homedir(), 'blt');

const argv = require('yargs')
    .options('branch', {
        alias: 'b',
        describe: 'wihch core branch to release the artifact',
    })
    .option('target', {
        alias: 't',
        describe: 'which artifact to copy and release',
    })
    .boolean('skip-git-check')
    .describe('skip-git-check', 'skips git branch and status check')
    .boolean('skip-build')
    .describe('skip-build', 'skips building')
    .boolean('skip-clean')
    .describe('skip-clean', 'skips cleaning')
    .help().argv;

const CORE_BRANCH = argv.branch || 'main';
const CORE_LDS_PATH = path.resolve(
    BLT_HOME,
    'app',
    CORE_BRANCH,
    'core/ui-force-components/modules/force/lds/lds.js'
);

const CORE_LDS_NATIVE_PROXY_PATH = path.resolve(
    BLT_HOME,
    'app',
    CORE_BRANCH,
    'core/ui-bridge-components/modules/native/ldsNativeProxy/ldsNativeProxy.js'
);

const CORE_LDS_STATIC_FUNCTIONS_PATH = path.resolve(
    BLT_HOME,
    'app',
    CORE_BRANCH,
    'core/ui-force-components/modules/force/lds/lds-static-functions.js'
);

const RELEASABLE_BRANCHES = ['master'];

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
        error(
            `LDS doesn't exist at ${corePath}. Make sure that the branch you want to release into is enabled.`
        );
    }

    try {
        fs.accessSync(corePath, fs.constants.W_OK);
    } catch {
        error(`LDS file is not writable. Make sure to run "p4 edit ${corePath}".`);
    }
}

function checkGitStatus() {
    console.log('* Check git status');

    const currentBranch = execSync(`git branch | grep \\* | cut -d ' ' -f2`)
        .toString()
        .trim();

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

function build() {
    console.log('* Build');
    execSync('yarn', {
        cwd: REPO_ROOT,
        stdio: 'ignore',
    });
}

function printCommits(corePath) {
    console.log('* Include commits:');
    const hash = execSync(`tail -n 1 ${corePath}`)
        .toString()
        .trim()
        .split('-')[1];

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
}

(function() {
    console.log('Releasing to:');
    console.log(`- blt home: ${BLT_HOME}`);
    console.log(`- core branch: ${CORE_BRANCH}`);
    console.log(`- lds path:  ${CORE_LDS_PATH}`);
    console.log(`- ldsNativeProxy path:  ${CORE_LDS_NATIVE_PROXY_PATH}`);
    console.log();

    if (argv.target === 'lds') {
        checkCore(CORE_LDS_PATH);
        checkCore(CORE_LDS_STATIC_FUNCTIONS_PATH);
    } else if (argv.target === 'native') {
        checkCore(CORE_LDS_NATIVE_PROXY_PATH);
    } else {
        checkCore(CORE_LDS_PATH);
        checkCore(CORE_LDS_STATIC_FUNCTIONS_PATH);
        checkCore(CORE_LDS_NATIVE_PROXY_PATH);
    }

    if (!argv['skip-git-check']) {
        checkGitStatus();
    }

    if (!argv['skip-clean']) {
        clean();
    }

    if (!argv['skip-build']) {
        build();
    }

    // TODO: enable later
    //printCommits(CORE_LDS_PATH);

    if (argv.target === 'lds') {
        copyArtifacts(REPO_LDS_PATH, CORE_LDS_PATH);
        copyArtifacts(REPO_LDS_STATIC_FUNCTIONS_PATH, CORE_LDS_STATIC_FUNCTIONS_PATH);
    } else if (argv.target === 'native') {
        copyArtifacts(REPO_LDS_NATIVE_PROXY_PATH, CORE_LDS_NATIVE_PROXY_PATH);
    } else {
        copyArtifacts(REPO_LDS_PATH, CORE_LDS_PATH);
        copyArtifacts(REPO_LDS_STATIC_FUNCTIONS_PATH, CORE_LDS_STATIC_FUNCTIONS_PATH);
        copyArtifacts(REPO_LDS_NATIVE_PROXY_PATH, CORE_LDS_NATIVE_PROXY_PATH);
    }
})();
