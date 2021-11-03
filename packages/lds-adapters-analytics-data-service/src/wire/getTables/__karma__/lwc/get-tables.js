import { api, LightningElement, wire } from 'lwc';
import { getTables } from 'lds-adapters-analytics-data-service';

export default class GetTables extends LightningElement {
    wirePushCount = -1;

    @api dbName;
    @api schemaName;

    @wire(getTables, {
        databaseName: '$dbName',
        schemaName: '$schemaName',
    })
    onGetTables({ data, error }) {
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
