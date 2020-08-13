import { LightningElement, wire, api } from 'lwc';
import { getRecordCreateActions } from 'lds-adapters-uiapi';

export default class RecordCreateActions extends LightningElement {
    @api objectApiName;
    wirePushCount = -1;

    @wire(getRecordCreateActions, {
        objectApiName: '$objectApiName',
    })
    onGetRecordCreateActions(result) {
        this.action = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.action.data;
    }

    @api pushCount() {
        return this.wirePushCount;
    }

    @api
    getWiredError() {
        return this.action.error;
    }
}
