import { LightningElement, wire, api } from 'lwc';
import { getRecord, refresh } from 'lds';

export default class RecordLayoutTypes extends LightningElement {
    @api recordId;
    @api layoutTypes;
    @api modes;
    @api optionalFields;
    wirePushCount = -1;

    @wire(getRecord, {
        recordId: '$recordId',
        layoutTypes: '$layoutTypes',
        modes: '$modes',
        optionalFields: '$optionalFields',
    })
    onGetRecord(result) {
        this.record = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.record.data;
    }

    @api getWiredError() {
        return this.record.error;
    }

    @api pushCount() {
        return this.wirePushCount;
    }

    @api refresh() {
        return refresh(this.record);
    }
}
