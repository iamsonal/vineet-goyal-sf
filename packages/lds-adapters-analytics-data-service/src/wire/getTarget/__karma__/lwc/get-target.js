import { api, LightningElement, wire } from 'lwc';
import { getTarget } from 'lds-adapters-analytics-data-service';

export default class GetTarget extends LightningElement {
    wirePushCount = -1;

    @api id;

    @wire(getTarget, {
        id: '$id',
    })
    onGetTarget({ data, error }) {
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
