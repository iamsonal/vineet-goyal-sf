import { api, LightningElement, wire } from 'lwc';
import { getStarterTemplateById } from 'lds-adapters-marketing-assetcreation';

export default class GetStarterTemplateById extends LightningElement {
    wirePushCount = -1;

    @api starterTemplateId;
    @api type;

    @wire(getStarterTemplateById, { starterTemplateId: '$starterTemplateId', type: '$type' })
    onGetStarterTemplateById({ data, error }) {
        this.starterTemplate = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredStarterTemplateById() {
        return this.starterTemplate;
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
