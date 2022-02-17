import { api, LightningElement, wire } from 'lwc';
import { executeSoqlQueryPost } from 'lds-adapters-analytics-wave-private';

export default class WiredExecuteSoqlQueryPost extends LightningElement {
    wirePushCount = -1;

    @api
    query;

    @wire(executeSoqlQueryPost, {
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
        return this.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
