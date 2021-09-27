import { api, LightningElement, wire } from 'lwc';
import { getListUi, refresh } from 'lds-adapters-uiapi';

export default class Basic extends LightningElement {
    @api listViewId;
    @api pageSize;
    @api pageToken;
    @api fields;
    @api sortBy;
    wirePushCount = -1;

    @wire(getListUi, {
        listViewId: '$listViewId',
        pageSize: '$pageSize',
        pageToken: '$pageToken',
        fields: '$fields',
        sortBy: '$sortBy',
    })
    onGetList(result) {
        this.listView = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.listView;
    }

    @api
    getWiredError() {
        return this.listView.error;
    }

    @api pushCount() {
        return this.wirePushCount;
    }

    @api refresh() {
        return refresh(this.listView);
    }
}
