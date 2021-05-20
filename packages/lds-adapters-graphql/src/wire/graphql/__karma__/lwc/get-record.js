import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lds-adapters-uiapi';

export default class RecordFields extends LightningElement {
    @api recordId;
    @api fields;
    @api optionalFields;
    wirePushCount = -1;

    @wire(getRecord, {
        recordId: '$recordId',
        fields: '$fields',
        optionalFields: '$optionalFields',
    })
    onGetRecord(result) {
        this.record = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.record.data;
    }

    @api pushCount() {
        return this.wirePushCount;
    }

    @api getWiredError() {
        return this.record.error;
    }
}
