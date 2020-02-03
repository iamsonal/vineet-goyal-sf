import { api, LightningElement, wire } from 'lwc';
import { getListUi } from 'lds';

export default class ListViewId extends LightningElement {
    @api fields;
    @api listViewApiName;
    @api objectApiName;
    @api optionalFields;
    @api pageSize;
    @api pageToken;

    @wire(getListUi, {
        objectApiName: '$objectApiName',
        listViewApiName: '$listViewApiName',
        pageSize: '$pageSize',
        pageToken: '$pageToken',
        fields: '$fields',
        optionalFields: '$optionalFields',
    })
    onGetList(result) {
        this.listView = result;
    }

    @api
    getWiredData() {
        return this.listView;
    }
}
