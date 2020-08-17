import { LightningElement, wire, api } from 'lwc';
import { getObjectCreateActions } from 'lds-adapters-uiapi';

export default class ObjectCreateActions extends LightningElement {
    @api objectApiName;
    wirePushCount = -1;

    @wire(getObjectCreateActions, {
        objectApiName: '$objectApiName',
    })
    onGetObjectCreateActions(result) {
        this.action = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.action.data;
    }

    @api pushCount() {
        return this.wirePushCount;
    }

    @api
    getWiredError() {
        return this.action.error;
    }
}
