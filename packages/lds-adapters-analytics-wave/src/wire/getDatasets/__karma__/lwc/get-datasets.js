import { api, LightningElement, wire } from 'lwc';
import { getDatasets } from 'lds-adapters-analytics-wave';

export default class GetDatasets extends LightningElement {
    wirePushCount = -1;

    @api folderId;
    @api page;
    @api pageSize;
    @api q;
    @api scope;

    @wire(getDatasets, {
        folderId: '$folderId',
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
        return this.error.body;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
