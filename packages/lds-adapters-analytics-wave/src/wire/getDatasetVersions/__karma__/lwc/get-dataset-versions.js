import { api, LightningElement, wire } from 'lwc';
import { getDatasetVersions } from 'lds-adapters-analytics-wave';

export default class GetDatasetVersions extends LightningElement {
    wirePushCount = -1;

    @api idOfDataset;

    @wire(getDatasetVersions, {
        datasetIdOrApiName: '$idOfDataset',
    })
    onGetDatasetVersions({ data, error }) {
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
