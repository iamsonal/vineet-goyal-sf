import { LightningElement, wire, api } from 'lwc';
import { getDuplicateConfiguration } from 'lds-adapters-uiapi';

export default class Basic extends LightningElement {
    @api
    objectApiName;

    @api
    recordTypeId;

    wirePushCount = -1;

    @wire(getDuplicateConfiguration, {
        objectApiName: '$objectApiName',
        recordTypeId: '$recordTypeId',
    })
    onGetDuplicateConfiguration(result) {
        this.configuration = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.configuration.data;
    }

    @api getWiredError() {
        return this.configuration.error;
    }

    @api pushCount() {
        return this.wirePushCount;
    }
}
