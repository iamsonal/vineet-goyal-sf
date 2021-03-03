import { api, LightningElement, wire } from 'lwc';
import { getReplicatedDatasets } from 'lds-adapters-analytics-wave';

export default class GetReplicatedDatasets extends LightningElement {
    wirePushCount = -1;

    @api category;
    @api connector;
    @api sourceObject;

    @wire(getReplicatedDatasets, {
        category: '$category',
        connector: '$connector',
        sourceObject: '$sourceObject',
    })
    onGetReplicatedDatasets({ data, error }) {
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