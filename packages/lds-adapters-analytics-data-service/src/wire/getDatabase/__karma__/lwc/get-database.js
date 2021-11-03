import { api, LightningElement, wire } from 'lwc';
import { getDatabase } from 'lds-adapters-analytics-data-service';

export default class GetDatabase extends LightningElement {
    wirePushCount = -1;

    @api dbName;

    @wire(getDatabase, {
        databaseName: '$dbName',
    })
    onGetDatabase({ data, error }) {
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
