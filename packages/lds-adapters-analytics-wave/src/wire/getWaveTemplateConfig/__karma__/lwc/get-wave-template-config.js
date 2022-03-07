import { api, LightningElement, wire } from 'lwc';
import { getWaveTemplateConfig } from 'lds-adapters-analytics-wave';

export default class GetWaveTemplateConfig extends LightningElement {
    wirePushCount = -1;

    @api
    templateIdOrApiName;

    @api
    options;

    @api
    disableApex;

    @wire(getWaveTemplateConfig, {
        templateIdOrApiName: '$templateIdOrApiName',
        options: '$options',
        disableApex: '$disableApex',
    })
    onGetWaveTemplateConfig({ data, error }) {
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
