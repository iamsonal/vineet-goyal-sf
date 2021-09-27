import { api, LightningElement, wire } from 'lwc';
import { getListUi } from 'lds-adapters-uiapi';

export default class ListViewId extends LightningElement {
    @api objectApiName;
    @api pageSize;
    @api pageToken;
    @api q;
    @api recentListsOnly;

    wirePushCount = -1;

    @wire(getListUi, {
        objectApiName: '$objectApiName',
        pageSize: '$pageSize',
        pageToken: '$pageToken',
        q: '$q',
        recentListsOnly: '$recentListsOnly',
    })
    onGetListUi(result) {
        this.listViewSummaryCollection = result;
        this.wirePushCount++;
    }

    @api
    getWiredData() {
        return this.listViewSummaryCollection.data;
    }

    @api
    getWiredError() {
        return this.listViewSummaryCollection.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
