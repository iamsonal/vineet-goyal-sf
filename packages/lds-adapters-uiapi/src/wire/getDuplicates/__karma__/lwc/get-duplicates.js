import { LightningElement, wire, api } from 'lwc';
import { getDuplicates } from 'lds-adapters-uiapi';

export default class Basic extends LightningElement {
    @api apiName;
    @api fields;
    wirePushCount = -1;

    @wire(getDuplicates, {
        apiName: '$apiName',
        fields: '$fields',
    })
    onGetDuplicates(result) {
        this.results = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.results.data;
    }

    @api getWiredError() {
        return this.results.error;
    }

    @api pushCount() {
        return this.wirePushCount;
    }
}
