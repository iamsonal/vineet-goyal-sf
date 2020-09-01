const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const LIST_VIEW_NAME = 'All Opportunities';
let listViewId = await helpers.getListViewByName(LIST_VIEW_NAME);

await helpers.requestGetAndSave(
    `/ui-api/list-ui/${listViewId}`,
    path.join(rootDir, `list-ui-All-Opportunities.json`)
);
