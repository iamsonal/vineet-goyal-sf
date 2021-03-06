const { Command } = require('@oclif/core');
const inquirer = require('inquirer');
const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const spinners = require('cli-spinners');
const ora = require('ora');

const lernaJson = require('../../lerna.json');

const EMAIL_REGEXP = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

const LDS_RAML_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'luvio.raml.txt');
const LDS_PACKAGE_JSON_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'package.json.txt');
const LDS_TS_CONFIG_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'tsconfig.json.txt');
const LDS_ROLLUP_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'rollup.config.js.txt');
const LDS_API_RAML_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'api.raml.txt');
const LDS_ROLLUP_KARMA_TEMPLATE_PATH = path.resolve(
    __dirname,
    'templates',
    'rollup.config.karma.js.txt'
);
const LDS_KARMA_CONF_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'karma.conf.js.txt');
const LDS_KARMA_UTILS_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'karma-utils.js.txt');
const LDS_MOCKS_READ_ME_TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'README-mocks.txt');

const ldsRamlTemplate = fs.readFileSync(LDS_RAML_TEMPLATE_PATH).toString();
const ldsPackageJSONTemplate = fs.readFileSync(LDS_PACKAGE_JSON_TEMPLATE_PATH).toString();
const ldsRollupTemplate = fs.readFileSync(LDS_ROLLUP_TEMPLATE_PATH).toString();
const ldsTsConfigTemplate = fs.readFileSync(LDS_TS_CONFIG_TEMPLATE_PATH).toString();
const ldsApiRamlTemplate = fs.readFileSync(LDS_API_RAML_TEMPLATE_PATH).toString();
const ldsRollupKarmaTemplate = fs.readFileSync(LDS_ROLLUP_KARMA_TEMPLATE_PATH).toString();
const ldsKarmaConfTemplate = fs.readFileSync(LDS_KARMA_CONF_TEMPLATE_PATH).toString();
const ldsKarmaUtilsTemplate = fs.readFileSync(LDS_KARMA_UTILS_TEMPLATE_PATH).toString();
const ldsMocksReadMeTemplate = fs.readFileSync(LDS_MOCKS_READ_ME_TEMPLATE_PATH).toString();

const NAMESPACE_TAG = '{{NAMESPACE}}';
const DESCRIPTION_TAG = '{{DESCRIPTION_TAG}}';
const PACKAGE_NAME_TAG = '{{PACKAGE_NAME_TAG}}';
const PACKAGE_NAMESPACE_TAG = '{{PACKAGE_NAMESPACE}}';
const LDS_VERSION_TAG = '{{LDS_VERSION}}';
const LDS_LP_VERSION_TAG = '{{LDS_LP_VERSION}}';
const PACKAGE_CONTRIBUTORS_TAG = '{{PACKAGE_CONTRIBUTORS}}';
const BUNDLE_NAME_TAG = '{{BUNDLE_NAME}}';
const ARTIFACT_NAME = '{{ARTIFACT_NAME}}';
const RELEASE_CORE_TAG = '{{RELEASE_CORE}}';
const RELEASE_COREJAR_TAG = '{{RELEASE_COREJAR}}';
const RELEASE_CORE =
    '"release:core": "../../scripts/release/core.js --adapter={{PACKAGE_NAME_TAG}}",';
const RELEASE_COREJAR =
    '"release:corejar": "yarn build && packages/core-build/scripts/core.js --adapter={{PACKAGE_NAME_TAG}}",';

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderKarmaConf(cloud, family) {
    const trimmedFamilyName = family.trim().toLowerCase();
    const trimmedCloudName = cloud.trim().toLowerCase();
    const artifactName = `${trimmedCloudName}-${trimmedFamilyName}`;

    return ldsKarmaConfTemplate
        .replace(ARTIFACT_NAME, artifactName)
        .replace(PACKAGE_NAME_TAG, getPackageName(cloud, family));
}

function getLocalName(cloud, family) {
    const trimmedFamilyName = family.trim().toLowerCase();
    const trimmedCloudName = cloud.trim().toLowerCase();
    return `${trimmedCloudName}-${trimmedFamilyName}`;
}

function renderKarmaRollupConfig(cloud, family) {
    const artifactName = getLocalName(cloud, family);

    return ldsRollupKarmaTemplate
        .replace(ARTIFACT_NAME, artifactName)
        .replace(PACKAGE_NAME_TAG, getPackageName(cloud, family));
}

function renderRollupConfig(cloud, family) {
    const trimmedFamilyName = family.trim().toLowerCase();
    const trimmedCloudName = cloud.trim().toLowerCase();
    const bundleName = `${trimmedCloudName}${capitalize(trimmedFamilyName)}`;
    const artifactName = `${trimmedCloudName}-${trimmedFamilyName}`;
    return ldsRollupTemplate
        .replace(BUNDLE_NAME_TAG, bundleName)
        .replace(ARTIFACT_NAME, artifactName);
}

function renderPackageJSON(config) {
    const { description, packageName, cloud, family, releaseToCore } = config;
    const formatted = ldsPackageJSONTemplate
        .replace(DESCRIPTION_TAG, description)
        .replace(RELEASE_CORE_TAG, releaseToCore ? RELEASE_CORE : '')
        .replace(RELEASE_COREJAR_TAG, releaseToCore ? RELEASE_COREJAR : '')
        .replace(new RegExp(PACKAGE_NAME_TAG, 'g'), packageName)
        .replace(PACKAGE_NAMESPACE_TAG, getPackageNamespace(cloud))
        .replace(new RegExp(LDS_VERSION_TAG, 'g'), config.engineVersion)
        .replace(new RegExp(LDS_LP_VERSION_TAG, 'g'), lernaJson.version)
        .replace(PACKAGE_CONTRIBUTORS_TAG, JSON.stringify(config.contacts))
        .replace(new RegExp(ARTIFACT_NAME, 'g'), getLocalName(cloud, family));

    return JSON.stringify(JSON.parse(formatted), null, 2);
}

function generate(config) {
    const { packageName, family, cloud } = config;
    const localName = getLocalName(cloud, family);
    const packagePath = path.resolve(__dirname, '../../packages', packageName);
    const packageRamlPath = path.resolve(packagePath, 'src', 'raml');
    const ldsRamlPath = path.resolve(packageRamlPath, 'luvio.raml');
    const apiRamlPath = path.resolve(packageRamlPath, 'api.raml');
    const packageJsonPath = path.resolve(packagePath, 'package.json');
    const tsConfigPath = path.resolve(packagePath, 'tsconfig.json');
    const rollupPath = path.resolve(packagePath, 'rollup.config.js');
    const rollupKarmaPath = path.resolve(packagePath, 'rollup.config.karma.js');
    const karmaConfPath = path.resolve(packagePath, 'karma.conf.js');
    const karmaUtilsPath = path.resolve(packagePath, 'karma', `${localName}-test-util.js`);
    const mocksReadmePath = path.resolve(packagePath, 'src', 'mocks', 'types', 'README');

    mkdirp.sync(`${packagePath}/src/raml`);
    mkdirp.sync(`${packagePath}/karma`);
    mkdirp.sync(`${packagePath}/src/mocks/types`);
    fs.writeFileSync(ldsRamlPath, ldsRamlTemplate.replace(NAMESPACE_TAG, family));
    fs.writeFileSync(packageJsonPath, renderPackageJSON(config));
    fs.writeFileSync(tsConfigPath, ldsTsConfigTemplate);
    fs.writeFileSync(rollupPath, renderRollupConfig(cloud, family));
    fs.writeFileSync(apiRamlPath, ldsApiRamlTemplate);
    fs.writeFileSync(rollupKarmaPath, renderKarmaRollupConfig(cloud, family));
    fs.writeFileSync(karmaConfPath, renderKarmaConf(cloud, family));
    fs.writeFileSync(karmaUtilsPath, ldsKarmaUtilsTemplate);
    fs.writeFileSync(mocksReadmePath, ldsMocksReadMeTemplate);
}

function getPackageNamespace() {
    return '@salesforce';
}

function getPackageName(cloud, family) {
    return `lds-adapters-${cloud.trim().toLowerCase()}-${family.trim().toLowerCase()}`;
}

async function getEngineVersion() {
    return new Promise((resolve, reject) => {
        child_process.exec('npm show @luvio/engine version', (err, data) => {
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
            message: 'Contact E-mail Address:',
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
                choices: [
                    'Analytics',
                    'Community',
                    'Commerce',
                    'Marketing',
                    'Mule',
                    'Platform',
                    'Industries',
                    'Revenue',
                    'Sales',
                ],
            },
            {
                type: 'input',
                name: 'family',
                message: 'What is your API Family name?',
            },
            {
                type: 'input',
                name: 'description',
                message: 'Describe your API Family:',
            },
            {
                type: 'list',
                name: 'releaseToCore',
                message:
                    'Do you plan to use your adapter package in core (if the answer is yes, please create core module beforehand)?',
                choices: ['yes', 'no'],
                filter: (val) => val === 'yes',
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
