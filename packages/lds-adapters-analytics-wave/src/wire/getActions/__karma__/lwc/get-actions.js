import { api, LightningElement, wire } from 'lwc';
import { getActions } from 'lds-adapters-analytics-wave';

export default class GetActions extends LightningElement {
    wirePushCount = -1;

    @api entityId;

    @wire(getActions, {
        entityId: '$entityId',
    })
    onGetActions({ data, error }) {
        this.data = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.data;
    }

    @api
    getWiredError() {
        return this.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
