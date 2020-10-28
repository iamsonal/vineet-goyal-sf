import { api, LightningElement, wire } from 'lwc';
import { getAnalyticsLimits } from 'lds-adapters-analytics-wave';

export default class GetAnalyticsLimits extends LightningElement {
    wirePushCount = -1;

    @api types;
    @api licenseType;

    @wire(getAnalyticsLimits, {
        types: '$types',
        licenseType: '$licenseType',
    })
    onGetAnalyticsLimits({ data, error }) {
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
