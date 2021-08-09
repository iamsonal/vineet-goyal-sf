import { api, LightningElement, wire } from 'lwc';
import { getDatasets } from 'lds-adapters-analytics-wave';

export default class GetDatasets extends LightningElement {
    wirePushCount = -1;

    @api types;
    @api folderId;
    @api includeCurrentVersion;
    @api licenseType;
    @api page;
    @api pageSize;
    @api q;
    @api scope;

    @wire(getDatasets, {
        datasetTypes: '$types',
        folderId: '$folderId',
        includeCurrentVersion: '$includeCurrentVersion',
        licenseType: '$licenseType',
        page: '$page',
        pageSize: '$pageSize',
        q: '$q',
        scope: '$scope',
    })
    onGetDatasets({ data, error }) {
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
