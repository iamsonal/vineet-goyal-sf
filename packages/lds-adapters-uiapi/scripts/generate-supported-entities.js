/* eslint-disable no-console */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const core = path.join(process.env.BLT_HOME, 'app', 'main', 'core');

// find the API version of core
const pomXml = path.join(core, 'ui-services-connection-wsc', 'pom.xml');
const pom = fs.readFileSync(pomXml);

// would be more correct to do XML/XSL here, but that seems like overkill
const coreApiVersion = parseFloat(/<currentVersion>([\d.]+)<\/currentVersion>/.exec(pom)[1]);

console.log(`${core} is at API version ${coreApiVersion.toFixed(1)}`);

// read the UI API allow-list, location taken from https://salesforce.quip.com/kub0ARlCCyYs
const allowListYaml = path.join(
    core,
    'ui-services-private',
    'resources',
    'module-config',
    'ui-services-private-object-allow-list.yaml'
);
const allowList = yaml.parse(fs.readFileSync(allowListYaml, { encoding: 'utf8' }));

console.log(`read UIAPI allow list from ${allowListYaml}`);

// use the API version to pick out the supported entities
const supportedEntities = {};
Object.entries(
    allowList['ui-services-private-object-allow-list'].StandardAllowListedObjects
).forEach(([entityName, entityInfo]) => {
    if (parseFloat(entityInfo.minApiVersion) > coreApiVersion) {
        return;
    }

    if (entityInfo.maxApiVersion && parseFloat(entityInfo.maxApiVersion) < coreApiVersion) {
        return;
    }

    supportedEntities[entityName] = true;
});

console.log(`found ${Object.keys(supportedEntities).length} supported entities`);

// grab p4 changelist of allow list
const filelogResult = spawnSync('p4', ['filelog', '-m', '1', allowListYaml]);
const [, allowListDepotPath, allowListRevision, allowListChangelist] =
    /(\/\/app\/.*)\n.*#(\d+) change (\d+)/.exec(filelogResult.stdout.toString());

// generate supported-entities.ts
const supportedEntitiesTs = path.join('src', 'util', 'supported-entities.ts');

const prolog = `/**
 * A set of the string names of known ui-api supported entities.
 *
 * Generated
 *     from: ${allowListDepotPath}#${allowListRevision} (changelist ${allowListChangelist})
 *     API version: ${coreApiVersion}
 *     at: ${new Date().toUTCString()}
 */
export const UIAPI_SUPPORTED_ENTITY_API_NAMES: { [key: string]: true } = {
`;

const entityList = Object.keys(supportedEntities)
    .sort()
    .map((entity) => `    ${entity}: true,`)
    .join('\n');

const epilog = `
};
`;
fs.writeFileSync(supportedEntitiesTs, prolog + entityList + epilog);

console.log(`updated ${supportedEntitiesTs}`);
