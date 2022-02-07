import { api, LightningElement, wire } from 'lwc';
import { getCatalogTables } from 'lds-adapters-analytics-data-service';

export default class GetCatalogTables extends LightningElement {
    wirePushCount = -1;

    @api dbName;
    @api schemaName;
    @api userId;

    @wire(getCatalogTables, {
        schema: '$schemaName',
        database: '$dbName',
        userId: '$userId',
    })
    onGetCatalogTables({ data, error }) {
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
