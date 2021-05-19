import { api, LightningElement, wire } from 'lwc';
import { getReplicatedDataset } from 'lds-adapters-analytics-wave';

export default class GetReplicatedDataset extends LightningElement {
    wirePushCount = -1;

    @api replicatedDatasetId;

    @wire(getReplicatedDataset, {
        id: '$replicatedDatasetId',
    })
    onGetReplicatedDataset({ data, error }) {
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