import { LightningElement, api, wire } from 'lwc';
import { getListInfosByName, refresh } from 'lds-adapters-uiapi';

export default class Basic extends LightningElement {
    @api
    names;

    listInfos;
    wirePushCount = -1;

    @wire(getListInfosByName, {
        names: '$names',
    })
    onGetListInfos(result) {
        this.listInfos = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.listInfos.data;
    }

    @api
    getWiredError() {
        return this.listInfos.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    refresh() {
        return refresh(this.listInfos);
    }
}
