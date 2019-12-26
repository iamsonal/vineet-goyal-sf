import { LightningElement, wire, api } from 'lwc';
import { getLookupRecords, refresh } from 'lds';

export default class Basic extends LightningElement {
    @api fieldApiName;
    @api targetApiName;
    @api requestParams;

    wirePushCount = -1;

    @wire(getLookupRecords, {
        fieldApiName: '$fieldApiName',
        requestParams: '$requestParams',
        targetApiName: '$targetApiName',
    })
    onGetLookupRecords(result) {
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
