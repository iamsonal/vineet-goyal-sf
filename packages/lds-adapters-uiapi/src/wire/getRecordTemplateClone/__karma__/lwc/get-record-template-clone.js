import { LightningElement, wire, api } from 'lwc';
import { getRecordTemplateClone, refresh } from 'lds-adapters-uiapi';

export default class GetRecordTemplateClone extends LightningElement {
    @api recordId;
    @api recordTypeId;
    @api optionalFields;

    wirePushCount = -1;

    @wire(getRecordTemplateClone, {
        recordId: '$recordId',
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
