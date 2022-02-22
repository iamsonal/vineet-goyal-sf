const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

await helpers.requestGetAndSave(
    `/connect/interaction/builder/rules?flowTriggerType=None&recordTriggerType=None`,
    path.join(rootDir, `allRulesNoTriggerTypeNoRecordTriggerType.json`)
);
await helpers.requestGetAndSave(
    `/connect/interaction/builder/rules?flowTriggerType=Scheduled&recordTriggerType=Update`,
    path.join(rootDir, `allRulesScheduledTriggerTypeUpdateRecordTriggerType.json`)
);
