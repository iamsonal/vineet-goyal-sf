import { api, LightningElement, wire } from 'lwc';
import { getStarterTemplates } from 'lds-adapters-marketing-assetcreation';

export default class GetStarterTemplates extends LightningElement {
    wirePushCount = -1;

    @api type;

    @wire(getStarterTemplates, { type: '$type' })
    onGetStarterTemplates({ data, error }) {
        this.starterTemplates = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredStarterTemplates() {
        return this.starterTemplates;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error;
    }
}
