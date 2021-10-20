import { api, LightningElement, wire } from 'lwc';
import { getConnector } from 'lds-adapters-analytics-data-service';

export default class GetConnector extends LightningElement {
    wirePushCount = -1;

    @api id;

    @wire(getConnector, {
        id: '$id',
    })
    onGetConnector({ data, error }) {
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
