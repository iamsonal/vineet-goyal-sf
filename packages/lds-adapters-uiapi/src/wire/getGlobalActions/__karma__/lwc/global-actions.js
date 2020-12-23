import { LightningElement, wire, api } from 'lwc';
import { getGlobalActions, refresh } from 'lds-adapters-uiapi';

export default class GlobalActions extends LightningElement {
    @api actionTypes;
    @api apiNames;
    @api formFactor;
    @api retrievalMode;
    @api sections;
    wirePushCount = -1;

    @wire(getGlobalActions, {
        actionTypes: '$actionTypes',
        apiNames: '$apiNames',
        formFactor: '$formFactor',
        retrievalMode: '$retrievalMode',
        sections: '$sections',
    })
    onGetGlobalActions(result) {
        this.action = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.action.data;
    }

    @api pushCount() {
        return this.wirePushCount;
    }

    @api refresh() {
        return refresh(this.action);
    }
    @api
    getWiredError() {
        return this.action.error;
    }
}
