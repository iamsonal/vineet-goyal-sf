import { api, LightningElement, wire } from 'lwc';
import { getReplicatedFields } from 'lds-adapters-analytics-wave';

export default class GetReplicatedFields extends LightningElement {
    wirePushCount = -1;

    @api replicatedDatasetId;

    @wire(getReplicatedFields, {
        id: '$replicatedDatasetId',
    })
    onGetReplicatedFields({ data, error }) {
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
