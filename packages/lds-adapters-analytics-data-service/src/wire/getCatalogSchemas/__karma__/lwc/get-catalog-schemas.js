import { api, LightningElement, wire } from 'lwc';
import { getCatalogSchemas } from 'lds-adapters-analytics-data-service';

export default class GetCatalogSchemas extends LightningElement {
    wirePushCount = -1;

    @api dbName;

    @wire(getCatalogSchemas, {
        database: '$dbName',
    })
    onGetCatalogSchemas({ data, error }) {
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
