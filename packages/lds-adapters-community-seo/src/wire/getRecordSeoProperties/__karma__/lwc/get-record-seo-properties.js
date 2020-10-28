import { api, LightningElement, wire } from 'lwc';
import { getRecordSeoProperties } from 'lds-adapters-community-seo';

export default class GetRecordSeoProperties extends LightningElement {
    wirePushCount = -1;

    @api communityId;
    @api recordId;
    @api fields;

    @wire(getRecordSeoProperties, {
        communityId: '$communityId',
        recordId: '$recordId',
        fields: '$fields',
    })
    onGetSeoProperties(results) {
        this.seoProperties = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    getWiredSeoProperties() {
        return this.seoProperties;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error.body;
    }
}
