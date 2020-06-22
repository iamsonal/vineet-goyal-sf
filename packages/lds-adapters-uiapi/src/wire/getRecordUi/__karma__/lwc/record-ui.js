import { api, LightningElement, wire } from 'lwc';
import { getRecordUi, deleteRecord, refresh } from 'lds-adapters-uiapi';

export default class RecordUi extends LightningElement {
    @api recordIds;
    @api layoutTypes;
    @api modes;
    @api optionalFields;
    wirePushCount = -1;

    @wire(getRecordUi, {
        recordIds: '$recordIds',
        layoutTypes: '$layoutTypes',
        modes: '$modes',
        optionalFields: '$optionalFields',
    })
    onGetRecordUi(result) {
        this.recordUi = result;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.recordUi.data;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api getWiredError() {
        return this.recordUi.error;
    }

    @api deleteRecord(recordId) {
        return deleteRecord(recordId);
    }

    @api refresh() {
        return refresh(this.recordUi);
    }
}
