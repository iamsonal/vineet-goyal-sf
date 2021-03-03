import { api, LightningElement, wire } from 'lwc';
import { executeQuery } from 'lds-adapters-analytics-wave';

export default class WiredExecuteQuery extends LightningElement {
    wirePushCount = -1;

    @api
    query;

    @wire(executeQuery, {
        query: '$query',
    })
    onExecuteQuery({ data, error }) {
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
