const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

try {
    // FIXME: figure out how to increase user license limits so we can create a fresh user here instead of reusing one
    // const userId = await createUser();

    const sysAdminUserId = await helpers.getSysAdminUserId();
    await updateUserCity(sysAdminUserId, 'Atlanta');

    const accountId = await helpers.createAccountWithOwner(sysAdminUserId);
    const opportunityId = await helpers.createOpportunityWithAccount(accountId);

    // some tests depend on the account and opportunity being connected so write out here
    await writeOpportunityPayloads(opportunityId);
} catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error during script: ', e);
} finally {
    await helpers.cleanup();
}

async function writeOpportunityPayloads(opportunityId) {
    const entries = [
        {
            filename: 'record-Opportunity-fields-Opportunity.OwnerId',
            params: '?fields=Opportunity.OwnerId',
        },
        {
            filename: 'record-Opportunity-fields-Opportunity.Name',
            params: '?fields=Opportunity.Name',
        },
        {
            filename: 'record-Opportunity-fields-Opportunity.Name,Opportunity.SystemModStamp',
            params: '?fields=Opportunity.Name,Opportunity.SystemModStamp',
        },
    ];

    entries.forEach(async function(entry) {
        await helpers.requestGetAndSave(
            `/ui-api/records/${opportunityId}${entry.params}`,
            path.join(rootDir, `${entry.filename}.json`)
        );
    });
}

async function updateUserCity(userId, city) {
    // eslint-disable-next-line no-console
    console.log(`Updating User ${userId} to have City ${city}`);

    const results = await $conn.sobject('User').update({
        Id: userId,
        City: city,
    });

    if (!results.success) {
        throw new Error(`Error updating User ${userId}: ${results.errors}`);
    } else {
        return results.id;
    }
}
