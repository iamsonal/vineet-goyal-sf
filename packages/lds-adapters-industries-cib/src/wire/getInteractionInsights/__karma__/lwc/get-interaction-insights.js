import { api, LightningElement, wire } from 'lwc';
import { getInteractionInsights } from 'lds-adapters-industries-cib';

export default class GetInteractionInsights extends LightningElement {
    wirePushCount = -1;

    @api accountId;
    @api systemContext;
    @api showACR;
    @api limit;
    @api offset;
    @api isDirectContacts;

    @wire(getInteractionInsights, {
        accountId: '$accountId',
        systemContext: '$systemContext',
        showACR: '$showACR',
        limit: '$limit',
        offset: '$offset',
        isDirectContacts: '$isDirectContacts',
    })
    onGetInteractionInsights({ data, error }) {
        this.data = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredInteractionInsights() {
        return this.data;
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
