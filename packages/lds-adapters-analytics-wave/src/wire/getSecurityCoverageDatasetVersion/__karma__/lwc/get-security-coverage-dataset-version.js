import { api, LightningElement, wire } from 'lwc';
import { getSecurityCoverageDatasetVersion } from 'lds-adapters-analytics-wave';

export default class GetSecurityCoverageDatasetVersion extends LightningElement {
    wirePushCount = -1;

    // api name cannot start with "data" as it is a reserved word.
    @api idOfDataset;
    @api versionId;

    @wire(getSecurityCoverageDatasetVersion, {
        datasetIdOrApiName: '$idOfDataset',
        versionId: '$versionId',
    })
    onGetSecurityCoverageDatasetVersion({ data, error }) {
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
