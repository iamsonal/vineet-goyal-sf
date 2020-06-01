const { Command } = require('@oclif/command');
const inquirer = require('inquirer');
const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const spinners = require('cli-spinners');
const ora = require('ora');

const EMAIL_REGEXP = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

const LDS_RAML_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'lds.raml.txt');
const LDS_PACKAGE_JSON_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'package.json.txt');
const LDS_TS_CONFIG_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'tsconfig.json.txt');
const LDS_ROLLUP_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'rollup.config.js.txt');
const LDS_API_RAML_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'api.raml.txt');
const LDS_INDEX_TS_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'index.ts.txt');

const ldsRamlTemplate = fs.readFileSync(LDS_RAML_TEMPLATE_PATH).toString();
const ldsPackageJSONTemplate = fs.readFileSync(LDS_PACKAGE_JSON_TEMPLATE_PATH).toString();
const ldsRollupTemplate = fs.readFileSync(LDS_ROLLUP_TEMPLATE_PATH).toString();
const ldsTsConfigTemplate = fs.readFileSync(LDS_TS_CONFIG_TEMPLATE_PATH).toString();
const ldsApiRamlTemplate = fs.readFileSync(LDS_API_RAML_TEMPLATE_PATH).toString();
const ldsIndexTsTemplate = fs.readFileSync(LDS_INDEX_TS_TEMPLATE_PATH).toString();

const NAMESPACE_TAG = '{{NAMESPACE}}';
const DESCRIPTION_TAG = '{{DESCRIPTION_TAG}}';
const PACKAGE_NAME_TAG = '{{PACKAGE_NAME_TAG}}';
const PACKAGE_NAMESPACE_TAG = '{{PACKAGE_NAMESPACE}}';
const LDS_VERSION_TAG = '{{LDS_VERSION}}';
const PACKAGE_CONTRIBUTORS_TAG = '{{PACKAGE_CONTRIBUTORS}}';

function renderPackageJSON(config) {
    const { description, packageName, cloud } = config;
    const formatted = ldsPackageJSONTemplate
        .replace(DESCRIPTION_TAG, description)
        .replace(PACKAGE_NAME_TAG, packageName)
        .replace(PACKAGE_NAMESPACE_TAG, getPackageNamespace(cloud))
        .replace(new RegExp(LDS_VERSION_TAG, 'g'), config.engineVersion)
        .replace(PACKAGE_CONTRIBUTORS_TAG, JSON.stringify(config.contacts));

    return JSON.stringify(JSON.parse(formatted), null, 2);
}

function generate(config) {
    const { packageName, family } = config;
    const packagePath = path.resolve(__dirname, '../../packages', packageName);
    const packageRamlPath = path.resolve(packagePath, 'src', 'raml');
    const ldsRamlPath = path.resolve(packageRamlPath, 'lds.raml');
    const apiRamlPath = path.resolve(packageRamlPath, 'api.raml');
    const packageJsonPath = path.resolve(packagePath, 'package.json');
    const tsConfigPath = path.resolve(packagePath, 'tsconfig.json');
    const rollupPath = path.resolve(packagePath, 'rollup.config.js');
    const indexTsPath = path.resolve(packagePath, 'src', 'index.ts');

    mkdirp.sync(`${packagePath}/src/raml`);
    fs.writeFileSync(ldsRamlPath, ldsRamlTemplate.replace(NAMESPACE_TAG, family));
    fs.writeFileSync(packageJsonPath, renderPackageJSON(config));
    fs.writeFileSync(tsConfigPath, ldsTsConfigTemplate);
    fs.writeFileSync(rollupPath, ldsRollupTemplate);
    fs.writeFileSync(indexTsPath, ldsIndexTsTemplate);
    fs.writeFileSync(apiRamlPath, ldsApiRamlTemplate);
}

function getPackageNamespace(cloud) {
    switch (cloud) {
        case 'Platform':
            return '@salesforce';
        default:
            return `@${cloud.toLowerCase()}`;
    }
}

function getPackageName(cloud, family) {
    return `lds-adapters-${cloud.trim().toLowerCase()}-${family.trim().toLowerCase()}`;
}

async function getEngineVersion() {
    return new Promise((resolve, reject) => {
        child_process.exec('npm show @ldsjs/engine version', (err, data) => {
            if (err !== null) {
                reject(err);
                return;
            }
            resolve(data.toString().trim());
        });
    });
}

async function collectOwners(emails) {
    const emailsCount = Object.keys(emails).length;
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'email',
            message: 'Contact E-mail Address',
            validate(input) {
                if (input === '' && emailsCount > 0) {
                    return true;
                }

                if (EMAIL_REGEXP.test(input) === false) {
                    return 'Please enter a valid E-mail Address';
                }

                return true;
            },
        },
        {
            type: 'confirm',
            name: 'hasMore',
            message: 'Add another E-mail Address?',
        },
    ]);

    const allOwners = {
        ...emails,
        [answers.email]: true,
    };

    if (answers.hasMore === true) {
        return collectOwners(allOwners);
    }

    return allOwners;
}

module.exports = class CreateApiFamily extends Command {
    static description = 'Create Api Family Package';
    async run() {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'cloud',
                message: 'Which cloud is this package for?',
                choices: ['Community', 'Commerce', 'Marketing', 'Mule', 'Platform', 'Sales'],
            },
            {
                type: 'input',
                name: 'family',
                message: 'What is your API Family name?',
            },
            {
                type: 'input',
                name: 'description',
                message: 'Describe your API Family',
            },
        ]);

        const owners = await collectOwners({});

        const spinner = ora({
            text: 'Generating Package',
            spinner: spinners.bouncingBall,
        }).start();

        const engineVersion = await getEngineVersion();
        generate({
            packageName: getPackageName(answers.cloud, answers.family),
            engineVersion,
            ...answers,
            contacts: Object.keys(owners),
        });
        spinner.stop();
    }
};
