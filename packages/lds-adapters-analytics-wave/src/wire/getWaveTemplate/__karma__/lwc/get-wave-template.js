import { api, LightningElement, wire } from 'lwc';
import { getWaveTemplate } from 'lds-adapters-analytics-wave';

export default class GetWaveTemplate extends LightningElement {
    wirePushCount = -1;

    @api
    templateIdOrApiName;

    @api
    options;

    @wire(getWaveTemplate, {
        templateIdOrApiName: '$templateIdOrApiName',
        options: '$options',
    })
    onGetWaveTemplate({ data, error }) {
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
