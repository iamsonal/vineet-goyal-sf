import { api, LightningElement, wire } from 'lwc';
import { getTable } from 'lds-adapters-analytics-data-service';

export default class GetTable extends LightningElement {
    wirePushCount = -1;

    @api dbName;
    @api schemaName;
    @api tableName;

    @wire(getTable, {
        databaseName: '$dbName',
        schemaName: '$schemaName',
        tableName: '$tableName',
    })
    onGetTable({ data, error }) {
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
