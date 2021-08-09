import { api, LightningElement, wire } from 'lwc';
import { getDataConnectorStatus } from 'lds-adapters-analytics-wave';

export default class GetDataConnectorStatus extends LightningElement {
    wirePushCount = -1;

    @api connectorIdOrApiName;

    @wire(getDataConnectorStatus, {
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
