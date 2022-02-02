import { api, LightningElement, wire } from 'lwc';
import { getWaveTemplateReleaseNotes } from 'lds-adapters-analytics-wave';

export default class GetWaveTemplateReleaseNotes extends LightningElement {
    wirePushCount = -1;

    @api
    templateIdOrApiName;

    @wire(getWaveTemplateReleaseNotes, {
        templateIdOrApiName: '$templateIdOrApiName',
    })
    onGetWaveTemplateReleaseNotes({ data, error }) {
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
