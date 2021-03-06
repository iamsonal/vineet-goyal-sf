import { LightningElement, wire, api } from 'lwc';
import { getPicklistValuesByRecordType, refresh } from 'lds-adapters-uiapi';

export default class GetPicklistValues extends LightningElement {
    @api objectApiName;
    @api recordTypeId;

    wirePushCount = -1;

    @wire(getPicklistValuesByRecordType, {
        objectApiName: '$objectApiName',
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
