import { api, LightningElement, wire } from 'lwc';
import { getListUi, MRU } from 'lds-adapters-uiapi';

export default class MruListUi extends LightningElement {
    @api fields;
    @api objectApiName;
    @api optionalFields;
    @api pageSize;
    @api pageToken;
    @api sortBy;
    wirePushCount = -1;

    @wire(getListUi, {
        objectApiName: '$objectApiName',
        listViewApiName: MRU,
        pageSize: '$pageSize',
        pageToken: '$pageToken',
        fields: '$fields',
        optionalFields: '$optionalFields',
        sortBy: '$sortBy',
    })
    onGetListUi(result) {
        this.listUi = result;
        this.wirePushCount++;
    }

    @api
    getWiredData() {
        return this.listUi;
    }

    @api
    getWiredError() {
        return this.listUi.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
