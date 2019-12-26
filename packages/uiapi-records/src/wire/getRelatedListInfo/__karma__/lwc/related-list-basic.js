import { LightningElement, wire, api } from 'lwc';
import { getRelatedListInfo } from 'lds';

export default class Basic extends LightningElement {
    @api parentObjectApiName;
    @api recordTypeId;
    @api relatedListId;
    wirePushCount = -1;

    @wire(getRelatedListInfo, {
        parentObjectApiName: '$parentObjectApiName',
        recordTypeId: '$recordTypeId',
        relatedListId: '$relatedListId',
    })
    onGetRelatedListInfo(result) {
        this.relatedListInfo = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.relatedListInfo.data;
    }

    @api
    getError() {
        return this.relatedListInfo.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
