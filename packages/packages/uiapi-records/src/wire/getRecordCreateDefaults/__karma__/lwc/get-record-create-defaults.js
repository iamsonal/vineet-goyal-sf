import { LightningElement, wire, api } from 'lwc';
import { getRecordCreateDefaults, refresh } from 'lds';

export default class GetRecordCreateDefaults extends LightningElement {
    @api objectApiName;
    @api recordTypeId;
    @api formFactor;
    @api optionalFields;

    wirePushCount = -1;

    @wire(getRecordCreateDefaults, {
        objectApiName: '$objectApiName',
        recordTypeId: '$recordTypeId',
        formFactor: '$formFactor',
        optionalFields: '$optionalFields',
    })
    onGetResults(result) {
        this.data = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.data.data;
    }

    @api pushCount() {
        return this.wirePushCount;
    }

    @api getWiredError() {
        return this.data.error;
    }

    @api refresh() {
        return refresh(this.data);
    }
}
