// the adapters which are not included in the sfdc generated artifacts
module.exports = {
    // non-exported adapters
    getApps: true,
    getListUiByListViewId: true,
    getListUiByApiName: true,
    getListViewSummaryCollection: true,
    getMruListUi: true,
    getObjectInfoDirectory: true,
    getSelectedApp: true,
    getRecords: true, // WIP - Remove after 'Bulk Record Fetch' Epic is implemented

    // custom adapters
    updateLayoutUserState: true,
    updateRelatedListInfo: true,
};
