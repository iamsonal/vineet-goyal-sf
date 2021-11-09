import { api, LightningElement, wire } from 'lwc';
import { getTargets } from 'lds-adapters-analytics-data-service';

export default class GetTargets extends LightningElement {
    wirePushCount = -1;

    @api connectionId;

    @wire(getTargets, {
        connectionId: '$connectionId',
    })
    onGetTargets({ data, error }) {
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
