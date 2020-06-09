import { LightningElement, wire, api } from 'lwc';
import { getDuplicateConfiguration } from 'lds';

export default class Basic extends LightningElement {
    @api
    objectApiName;
    wirePushCount = -1;

    @wire(getDuplicateConfiguration, {
        objectApiName: '$objectApiName',
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
