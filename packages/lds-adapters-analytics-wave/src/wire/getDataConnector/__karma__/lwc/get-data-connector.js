import { api, LightningElement, wire } from 'lwc';
import { getDataConnector } from 'lds-adapters-analytics-wave';

export default class GetDataConnector extends LightningElement {
    wirePushCount = -1;

    @api connectorIdOrApiName;

    @wire(getDataConnector, {
        connectorIdOrApiName: '$connectorIdOrApiName',
    })
    onGetDataConnector({ data, error }) {
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
