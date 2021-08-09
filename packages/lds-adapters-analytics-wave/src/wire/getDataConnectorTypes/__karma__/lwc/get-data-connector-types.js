import { api, LightningElement, wire } from 'lwc';
import { getDataConnectorTypes } from 'lds-adapters-analytics-wave';

export default class GetDataConnectorTypes extends LightningElement {
    wirePushCount = -1;

    @wire(getDataConnectorTypes, {})
    onGetDataConnectorTypes({ data, error }) {
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
