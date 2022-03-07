import { api, LightningElement, wire } from 'lwc';
import { getCatalogDatabases } from 'lds-adapters-analytics-data-service';

export default class GetCatalogDatabases extends LightningElement {
    wirePushCount = -1;

    @wire(getCatalogDatabases)
    onGetCatalogDatabases({ data, error }) {
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
