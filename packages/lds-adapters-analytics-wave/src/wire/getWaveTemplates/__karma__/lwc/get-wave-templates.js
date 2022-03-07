import { api, LightningElement, wire } from 'lwc';
import { getWaveTemplates } from 'lds-adapters-analytics-wave';

export default class GetWaveTemplates extends LightningElement {
    wirePushCount = -1;

    @api options;
    @api type;

    @wire(getWaveTemplates, {
        options: '$options',
        type: '$type',
    })
    onGetWaveTemplates({ data, error }) {
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
