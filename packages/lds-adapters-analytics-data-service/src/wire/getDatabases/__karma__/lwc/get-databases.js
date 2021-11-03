import { api, LightningElement, wire } from 'lwc';
import { getDatabases } from 'lds-adapters-analytics-data-service';

export default class GetDatabases extends LightningElement {
    wirePushCount = -1;

    @wire(getDatabases, {})
    onGetDatabases({ data, error }) {
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
