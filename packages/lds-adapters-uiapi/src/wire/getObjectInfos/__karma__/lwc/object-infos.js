import { LightningElement, api, wire, track } from 'lwc';
import { getObjectInfos, refresh } from 'lds-adapters-uiapi';

export default class Basic extends LightningElement {
    @api objectApiNames;
    @track trackObjectInfos;
    wirePushCount = -1;

    @wire(getObjectInfos, {
        objectApiNames: '$objectApiNames',
    })
    onGetObjectInfo(result) {
        this.objectInfos = result;
        this.trackObjectInfos = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.objectInfos.data;
    }

    @api
    getWiredError() {
        return this.objectInfos.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    refresh() {
        return refresh(this.objectInfos);
    }

    @api refreshTracked() {
        return refresh(this.trackObjectInfos);
    }
}
