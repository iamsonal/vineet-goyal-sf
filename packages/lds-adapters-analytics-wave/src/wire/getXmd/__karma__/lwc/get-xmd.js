import { api, LightningElement, wire } from 'lwc';
import { getXmd } from 'lds-adapters-analytics-wave';

export default class GetXmd extends LightningElement {
    wirePushCount = -1;

    // lwc property names cannot start with 'data'
    @api
    idOrApiName;
    @api
    versionId;
    @api
    xmdType;

    @wire(getXmd, {
        datasetIdOrApiName: '$idOrApiName',
        versionId: '$versionId',
        xmdType: '$xmdType',
    })
    onGetXmd({ data, error }) {
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
