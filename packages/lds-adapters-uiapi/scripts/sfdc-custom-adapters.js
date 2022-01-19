// the adapters which are not included in the sfdc generated artifacts
module.exports = {
    PRIVATE_ADAPTERS: {
        // non-exported adapters
        getApps: true,
        getListUiByListViewId: true,
        getListUiByApiName: true,
        getListViewSummaryCollection: true,
        getMruListUi: true,
        getObjectInfoDirectory: true,
        getSelectedApp: true,

        // custom adapters
        updateLayoutUserState: true,
        updateRelatedListInfo: true,
        updateRelatedListPreferences: true,
    },
    INFINITE_SCROLLING_ADAPTERS: {
        // TODO [W-9770576]: enabling this when getRelatedListRecords is ready
        // getRelatedListRecords: true
    },
};
