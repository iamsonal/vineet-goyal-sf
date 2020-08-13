import { LightningElement, wire, api } from 'lwc';
import { getRecords } from 'lds-adapters-uiapi';
export default class GetRecords extends LightningElement {
    @api records;
    wirePushCount = -1;
    @wire(getRecords, {
        records: '$records',
    })
    onGetRecords(result) {
        this.recordsObject = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.recordsObject.data;
    }
    @api getWiredError() {
        return this.recordsObject.error;
    }

    @api pushCount() {
        return this.wirePushCount;
    }
}
