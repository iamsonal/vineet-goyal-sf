#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);
const helpers = require(helpersPath);

const entries = require(`${rootDir}/endpointEntries`);

try {
    const sysAdminUserId = await helpers.getSysAdminUserId();
    await helpers.createContactWithOwner(sysAdminUserId, 'Jake', 'Archibald');
    await helpers.createContactWithOwner(sysAdminUserId, 'Michelle', 'Jakuba');
    await helpers.createContactWithOwner(sysAdminUserId, 'Jake', 'Norris');

    await helpers.createAccountWithOwner(sysAdminUserId, 'Burlignton');
    await helpers.createAccountWithOwner(sysAdminUserId, 'Burros');
    await helpers.createAccountWithOwner(sysAdminUserId, 'Burton');

    entries.forEach(async function({ endpoint, filename, params = {} }) {
        const queryParams = Object.entries(params)
            .map(entry => entry.join('='))
            .join('&');
        await helpers.requestGetAndSave(
            `/ui-api/${endpoint}${queryParams ? '?' + queryParams : ''}`,
            path.join(rootDir, `${filename}.json`)
        );
    });
} catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error during script: ', e);
} finally {
    await helpers.cleanup();
}
