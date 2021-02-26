import { LightningElement, wire, api } from 'lwc';
import { getQuickActionDefaults, refresh } from 'lds-adapters-uiapi';

export default class GetQuickActionDefaults extends LightningElement {
    @api actionApiName;
    @api optionalFields;

    wirePushCount = -1;

    @wire(getQuickActionDefaults, {
        actionApiName: '$actionApiName',
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
