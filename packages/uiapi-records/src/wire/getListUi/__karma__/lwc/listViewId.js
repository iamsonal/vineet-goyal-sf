import { api, LightningElement, wire } from 'lwc';
import { getListUi } from 'lds';

export default class ListViewId extends LightningElement {
    @api listViewId;
    @api pageToken;
    @api pageSize;
    @api fields;
    @api optionalFields;
    @api sortBy;
    wirePushCount = -1;

    @wire(getListUi, {
        listViewId: '$listViewId',
        pageToken: '$pageToken',
        pageSize: '$pageSize',
        fields: '$fields',
        optionalFields: '$optionalFields',
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

    @api pushCount() {
        return this.wirePushCount;
    }
}
