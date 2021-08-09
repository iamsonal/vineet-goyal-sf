import { api, LightningElement, wire } from 'lwc';
import { getDataflowJobNodes } from 'lds-adapters-analytics-wave';

export default class GetDataflowJobNodes extends LightningElement {
    wirePushCount = -1;

    @api jobId;

    @wire(getDataflowJobNodes, {
        dataflowjobId: '$jobId',
    })
    onGetDataflowJobNodes({ data, error }) {
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
