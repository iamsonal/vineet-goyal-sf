import { api, LightningElement, wire } from 'lwc';
import { getConnection } from 'lds-adapters-analytics-data-service';

export default class GetConnection extends LightningElement {
    wirePushCount = -1;

    @api id;

    @wire(getConnection, {
        id: '$id',
    })
    onGetConnection({ data, error }) {
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
