import { LightningElement, api, track, wire } from 'lwc';
import { getObjectInfo, refresh } from 'lds';

export default class ObjectInfo extends LightningElement {
    @api objectApiName;
    @track trackObjectInfo;
    wirePushCount = -1;

    @wire(getObjectInfo, {
        objectApiName: '$objectApiName',
    })
    onGetObjectInfo(result) {
        this.objectInfo = result;
        this.trackObjectInfo = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.objectInfo.data;
    }

    @api
    getWiredError() {
        return this.objectInfo.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api refresh() {
        return refresh(this.objectInfo);
    }

    @api refreshTracked() {
        return refresh(this.trackObjectInfo);
    }
}
