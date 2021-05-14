import { api, LightningElement, track, wire } from 'lwc';
import { getDataflowJob, updateDataflowJob } from 'lds-adapters-analytics-wave';

export default class UpdateDataflowJob extends LightningElement {
    @track jobId;
    @wire(getDataflowJob, {
        dataflowjobId: '$jobId',
    })
    wiredDataflowJobResult;

    @api
    invokeUpdateDataflowJob({ dataflowjobId, dataflowJob: { command } }) {
        updateDataflowJob({ dataflowjobId, dataflowJob: { command } })
            .then(({ data }) => {
                this.jobData = data;
                this.jobId = dataflowjobId;
            })
            .catch((error) => {
                this.error = error;
            });
    }

    @api
    getData() {
        return this.jobData;
    }

    @api
    getWiredData() {
        return this.wiredDataflowJobResult && this.wiredDataflowJobResult.data;
    }

    @api
    getError() {
        return this.error.body;
    }
}
