import { api, LightningElement, wire } from 'lwc';
import { getReplicatedDatasetFields } from 'lds-adapters-analytics-wave';

export default class GetReplicatedDatasetFields extends LightningElement {
    wirePushCount = -1;

    @api replicatedDatasetId;

    @wire(getReplicatedDatasetFields, {
        id: '$replicatedDatasetId',
    })
    onGetReplicatedDatasetFields({ data, error }) {
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
