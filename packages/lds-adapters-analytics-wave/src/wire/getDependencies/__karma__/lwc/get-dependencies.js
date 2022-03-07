import { api, LightningElement, wire } from 'lwc';
import { getDependencies } from 'lds-adapters-analytics-wave';

export default class GetDependencies extends LightningElement {
    wirePushCount = -1;

    @api assetId;

    @wire(getDependencies, {
        assetId: '$assetId',
    })
    onGetDependencies({ data, error }) {
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
