import { api, LightningElement, wire } from 'lwc';
import { getSchema } from 'lds-adapters-analytics-data-service';

export default class GetSchema extends LightningElement {
    wirePushCount = -1;

    @api dbName;
    @api schemaName;

    @wire(getSchema, {
        databaseName: '$dbName',
        schemaName: '$schemaName',
    })
    onGetSchema({ data, error }) {
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
