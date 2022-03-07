import { api, LightningElement, wire } from 'lwc';
import { getCatalogDatabase } from 'lds-adapters-analytics-data-service';

export default class GetCatalogDatabase extends LightningElement {
    wirePushCount = -1;

    @api dbName;

    @wire(getCatalogDatabase, {
        database: '$dbName',
    })
    onGetCatalogDatabase({ data, error }) {
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
