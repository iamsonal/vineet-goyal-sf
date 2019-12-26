import { LightningElement, api, wire } from 'lwc';
import { getRecord, refresh } from 'lds';

export default class RecordFieldsLayoutTypes extends LightningElement {
    @api recordId;
    @api fields;
    @api layoutTypes;
    @api optionalFields;
    @api modes;
    wirePushCount = -1;

    @wire(getRecord, {
        recordId: '$recordId',
        layoutTypes: '$layoutTypes',
        fields: '$fields',
        optionalFields: '$optionalFields',
        modes: '$modes',
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

    @api refresh() {
        return refresh(this.record);
    }
}
