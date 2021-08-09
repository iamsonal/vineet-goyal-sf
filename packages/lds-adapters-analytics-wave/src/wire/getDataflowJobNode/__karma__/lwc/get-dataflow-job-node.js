import { api, LightningElement, wire } from 'lwc';
import { getDataflowJobNode } from 'lds-adapters-analytics-wave';

export default class GetDataflowJobNode extends LightningElement {
    wirePushCount = -1;

    @api jobId;
    @api nodeId;

    @wire(getDataflowJobNode, {
        dataflowjobId: '$jobId',
        nodeId: '$nodeId',
    })
    onGetDataflowJobNode({ data, error }) {
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
