import { LightningElement, wire, api } from 'lwc';
import { getPicklistValues, refresh } from 'lds';

export default class GetPicklistValues extends LightningElement {
    @api fieldApiName;
    @api recordTypeId;

    wirePushCount = -1;

    @wire(getPicklistValues, {
        fieldApiName: '$fieldApiName',
        recordTypeId: '$recordTypeId',
    })
    onGetPicklist(result) {
        this.picklist = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.picklist.data;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getWiredError() {
        return this.picklist.error;
    }

    @api
    refresh() {
        return refresh(this.picklist);
    }
}
