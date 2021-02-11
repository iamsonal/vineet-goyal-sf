import { LightningElement, wire, api } from 'lwc';
import { getListInfoByName, refresh } from 'lds-adapters-uiapi';

export default class Basic extends LightningElement {
    @api objectApiName;
    @api listViewApiName;

    wirePushCount = -1;

    @wire(getListInfoByName, {
        objectApiName: '$objectApiName',
        listViewApiName: '$listViewApiName',
    })
    onGetListInfo(result) {
        this.listInfo = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.listInfo.data;
    }

    @api
    getError() {
        return this.listInfo.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api refresh() {
        return refresh(this.listInfo);
    }
}
