import { api, LightningElement, wire } from 'lwc';
import { getContactsInteractions } from 'lds-adapters-industries-cib';

export default class GetContactsInteractions extends LightningElement {
    wirePushCount = -1;

    @api systemContext;
    @api contactIds;
    @api relatedRecordId;

    @wire(getContactsInteractions, {
        systemContext: '$systemContext',
        contactIds: '$contactIds',
        relatedRecordId: '$relatedRecordId',
    })
    onGetContactsInteractions({ data, error }) {
        this.data = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredContactsInteractions() {
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
