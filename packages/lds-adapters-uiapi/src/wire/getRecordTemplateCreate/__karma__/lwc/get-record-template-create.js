import { LightningElement, wire, api } from 'lwc';
import { getRecordTemplateCreate, refresh } from 'lds-adapters-uiapi';

export default class GetRecordDefaultsTemplateForCreate extends LightningElement {
    @api objectApiName;
    @api recordTypeId;
    @api optionalFields;

    wirePushCount = -1;

    @wire(getRecordTemplateCreate, {
        objectApiName: '$objectApiName',
        recordTypeId: '$recordTypeId',
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
