import { LightningElement, wire, api } from 'lwc';
import { getLookupActions } from 'lds';

export default class Basic extends LightningElement {
    @api actionTypes;
    @api formFactor;
    @api objectApiNames;
    @api sections;

    wirePushCount = -1;

    @wire(getLookupActions, {
        actionTypes: '$actionTypes',
        formFactor: '$formFactor',
        objectApiNames: '$objectApiNames',
        sections: '$sections',
    })
    onGetLookupActions(result) {
        this.action = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.action.data;
    }

    @api getWiredError() {
        return this.action.error;
    }

    @api pushCount() {
        return this.wirePushCount;
    }
}
