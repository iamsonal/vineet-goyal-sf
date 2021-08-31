import { api, LightningElement, wire } from 'lwc';
import { getDataflows } from 'lds-adapters-analytics-wave';

export default class GetDataflows extends LightningElement {
    wirePushCount = -1;

    @api q;

    @wire(getDataflows, {
        q: '$q',
    })
    onGetDataflows({ data, error }) {
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
