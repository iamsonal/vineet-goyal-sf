import { api, LightningElement, wire } from 'lwc';
import { getDataset } from 'lds-adapters-analytics-wave';

export default class GetDataset extends LightningElement {
    wirePushCount = -1;

    // lwc property names cannot start with 'data'
    @api
    idOrApiName;

    @wire(getDataset, {
        datasetIdOrApiName: '$idOrApiName',
    })
    onGetDataset({ data, error }) {
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
