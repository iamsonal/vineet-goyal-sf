/* eslint-disable no-console */

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

if (process.argv.length > 3) {
    console.error('Usage: generateMockData.js <optional-path-to-refreshData.js>');
    throw new Error('Unexpected number of arguments');
}

// path to script that regenerates payloads (refreshData.js)
const pathArg = process.argv[2];

const PACKAGES_ROOT = path.resolve(__dirname, '../../packages');

function generate(root = PACKAGES_ROOT) {
    if (!fs.lstatSync(root).isDirectory()) {
        root = path.dirname(root);
    }

    const filenames = glob.sync('**/refreshData.js', { cwd: root, absolute: true });
    for (const filename of filenames) {
        generatePayloads(filename);
    }
}

function generatePayloads(scriptPath) {
    console.log(`Executing repl script at ${scriptPath}`);
    const dataPath = path.dirname(scriptPath);

    try {
        fs.accessSync(scriptPath, fs.constants.X_OK);
    } catch (e) {
        console.error(`No permissions to execute script at ${scriptPath}`);
        return;
    }

    const helpersPath = require.resolve('./helpers');
    child_process.spawnSync('sfdx', ['repl:script', scriptPath, helpersPath], { stdio: 'inherit' });
}

generate(pathArg || PACKAGES_ROOT);
