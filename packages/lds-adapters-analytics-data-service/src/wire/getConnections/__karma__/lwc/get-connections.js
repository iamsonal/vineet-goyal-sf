import { api, LightningElement, wire } from 'lwc';
import { getConnections } from 'lds-adapters-analytics-data-service';

export default class GetConnections extends LightningElement {
    wirePushCount = -1;

    @wire(getConnections)
    onGetDataConnectors({ data, error }) {
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
