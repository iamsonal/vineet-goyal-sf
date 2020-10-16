import { api, LightningElement, wire } from 'lwc';
import { getDataflowJob } from 'lds-adapters-analytics-wave';

export default class GetDataflowJob extends LightningElement {
    wirePushCount = -1;

    @api jobId;

    @wire(getDataflowJob, {
        dataflowjobId: '$jobId',
    })
    onGetDataflowJob({ data, error }) {
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
