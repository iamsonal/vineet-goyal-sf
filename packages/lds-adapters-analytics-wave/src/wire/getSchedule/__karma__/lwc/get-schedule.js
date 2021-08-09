import { api, LightningElement, wire } from 'lwc';
import { getSchedule } from 'lds-adapters-analytics-wave';

export default class GetSchedule extends LightningElement {
    wirePushCount = -1;

    @api assetId;

    @wire(getSchedule, {
        assetId: '$assetId',
    })
    onGetSchedule({ data, error }) {
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
