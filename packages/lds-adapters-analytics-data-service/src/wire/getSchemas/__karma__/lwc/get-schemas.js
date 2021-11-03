import { api, LightningElement, wire } from 'lwc';
import { getSchemas } from 'lds-adapters-analytics-data-service';

export default class GetSchemas extends LightningElement {
    wirePushCount = -1;

    @api dbName;

    @wire(getSchemas, {
        databaseName: '$dbName',
    })
    onGetSchemas({ data, error }) {
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
