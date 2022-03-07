import { api, LightningElement, wire } from 'lwc';
import { getConnectionSourceObjects } from 'lds-adapters-analytics-data-service';

export default class GetConnectionSourceObjects extends LightningElement {
    wirePushCount = -1;

    @api id;
    @api page;
    @api pageSize;
    @api q;

    @wire(getConnectionSourceObjects, {
        id: '$id',
        page: '$page',
        pageSize: '$pageSize',
        q: '$q',
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
