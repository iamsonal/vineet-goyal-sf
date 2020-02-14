import { LightningElement, api, wire } from 'lwc';
import { getObjectInfos } from 'lds';

export default class Basic extends LightningElement {
    @api objectApiNames;
    wirePushCount = -1;

    @wire(getObjectInfos, {
        objectApiNames: '$objectApiNames',
    })
    onGetObjectInfo(result) {
        this.objectInfos = result;
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
}
