import { api, LightningElement, wire } from 'lwc';
import { queryMetrics } from 'lds-adapters-platform-scale-center';

export default class Query extends LightningElement {
    wirePushCount = -1;

    @api request;

    @wire(queryMetrics, {
        request: '$request',
    })
    onQuery({ data, error }) {
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
        return this.error.body;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
